"""Portmanteau iptv tool: search, playlist, EPG, VLC + Jellyfin handoff."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field

from iptv_org_mcp._mcp import mcp
from iptv_org_mcp.config import get_settings
from iptv_org_mcp.services import api_client, cache
from iptv_org_mcp.services import store as mem
from iptv_org_mcp.services.health import probe_streams
from iptv_org_mcp.services.jellyfin_export import jellyfin_handoff
from iptv_org_mcp.services.playlist import build_m3u

Operation = Literal[
    "search_channels",
    "get_channel",
    "search_streams",
    "build_playlist",
    "get_epg",
    "facets",
    "status",
    "check_streams",
    "jellyfin_setup",
    "play_in_vlc",
    "refresh",
    "help",
]


async def _ensure(name: str) -> list | dict:
    cached = mem.get_snapshot(name)
    if cached is not None:
        return cached
    data, _ = cache.load_snapshot(name)
    if data is None:
        data = await api_client.fetch_json(name)
        cache.save_snapshot(name, data)
    mem.set_snapshot(name, data)
    return data


@mcp.tool(app=True)
async def iptv(
    operation: Annotated[Operation, Field(description="Operation to perform")] = "status",
    query: Annotated[str, Field(description="Search text for channels/streams")] = "",
    country: Annotated[str, Field(description="ISO country filter, e.g. AT,DE")] = "",
    category: Annotated[str, Field(description="Category id, e.g. news,sports")] = "",
    channel_id: Annotated[str, Field(description="Channel id, e.g. ORF1.at")] = "",
    include_nsfw: Annotated[bool, Field(description="Include NSFW/blocked (default False)")] = False,
    exclude_geo_blocked: Annotated[bool, Field(description="Hide Geo-blocked labels")] = True,
    max_entries: Annotated[int, Field(description="Max playlist entries", ge=1, le=2000)] = 200,
    probe: Annotated[bool, Field(description="Probe streams before building M3U")] = False,
    stream_url: Annotated[str, Field(description="Single stream URL for play_in_vlc")] = "",
) -> dict:
    """Curated iptv-org discovery with dead-channel filtering.

    ## Return Format
    Dialogic dict: {success, message, ...operation data}.

    ## Examples
    - search_channels: {"operation": "search_channels", "query": "ORF"}
    - build_playlist: {"operation": "build_playlist", "country": "AT", "probe": true}
    - jellyfin_setup: {"operation": "jellyfin_setup", "country": "AT"}
    """
    op = operation
    if op == "help":
        return {
            "success": True,
            "message": "iptv operations",
            "operations": list(Operation.__args__),
            "hint": "start with facets, then search_channels, then build_playlist",
        }
    if op == "status":
        await _ensure("channels")
        counts = mem.stats()
        return {"success": True, "message": "iptv-org cache status", "datasets": counts}
    if op == "refresh":
        out: dict[str, int] = {}
        for name in ("channels", "streams", "guides", "categories", "blocklist"):
            data = await api_client.fetch_json(name)
            cache.save_snapshot(name, data)
            mem.set_snapshot(name, data)
            out[name] = len(data) if isinstance(data, list) else 1
        return {"success": True, "message": "refreshed upstream snapshots", "datasets": out}
    if op == "facets":
        channels = await _ensure("channels")
        cats = await _ensure("categories")
        countries = await _ensure("countries")
        return {
            "success": True,
            "message": "facets for playlist builder",
            "categories": cats if isinstance(cats, list) else [],
            "channel_count": len(channels) if isinstance(channels, list) else 0,
            "country_count": len(countries) if isinstance(countries, list) else 0,
        }
    if op == "search_channels":
        channels = await _ensure("channels")
        q = query.lower()
        rows = [c for c in channels if q in (c.get("name", "") + c.get("id", "")).lower()]
        if country:
            rows = [c for c in rows if c.get("country") == country.upper()]
        if category:
            rows = [c for c in rows if category in (c.get("categories") or [])]
        if not include_nsfw:
            rows = [c for c in rows if not c.get("is_nsfw")]
        return {"success": True, "message": f"{len(rows)} channels", "channels": rows[:100]}
    if op == "get_channel":
        channels = await _ensure("channels")
        feeds = await _ensure("feeds")
        streams = await _ensure("streams")
        guides = await _ensure("guides")
        ch = next((c for c in channels if c.get("id") == channel_id), None)
        if ch is None:
            return {"success": False, "message": f"channel '{channel_id}' not found"}
        return {
            "success": True,
            "message": ch.get("name", channel_id),
            "channel": ch,
            "feeds": [f for f in feeds if f.get("channel") == channel_id][:20],
            "streams": [s for s in streams if s.get("channel") == channel_id][:20],
            "guides": [g for g in guides if g.get("channel") == channel_id][:10],
        }
    if op == "search_streams":
        streams = await _ensure("streams")
        q = query.lower()
        rows = [s for s in streams if q in (s.get("title", "") + s.get("channel", "")).lower()]
        if exclude_geo_blocked:
            rows = [s for s in rows if "Geo-blocked" not in (s.get("labels") or [])]
        return {"success": True, "message": f"{len(rows)} streams", "streams": rows[:100]}
    if op == "check_streams":
        streams = await _ensure("streams")
        q = query.lower()
        urls = [s["url"] for s in streams if q in (s.get("title", "")).lower() and s.get("url")][:20]
        results = await probe_streams(urls)
        alive = sum(1 for r in results if r["ok"])
        return {"success": True, "message": f"{alive}/{len(results)} alive", "probes": results}
    if op == "build_playlist":
        channels = await _ensure("channels")
        streams = await _ensure("streams")
        countries = [c.strip().upper() for c in country.split(",") if c.strip()] or None
        categories = [c.strip() for c in category.split(",") if c.strip()] or None
        if probe:
            urls = [s["url"] for s in streams if s.get("url")][: get_settings().probe_max]
            probes = await probe_streams(urls)
            alive_urls = {p["url"] for p in probes if p["ok"]}
            streams = [s for s in streams if s.get("url") in alive_urls]
        m3u, stats = build_m3u(
            streams,
            channels,
            countries=countries,
            categories=categories,
            exclude_geo_blocked=exclude_geo_blocked,
            include_nsfw=include_nsfw,
            max_entries=max_entries,
        )
        settings = get_settings()
        out_dir = Path(settings.cache_dir) / "playlists"
        out_dir.mkdir(parents=True, exist_ok=True)
        tag = (country or "world").replace(",", "-").lower() or "world"
        path = out_dir / f"{tag}.m3u"
        path.write_text(m3u, encoding="utf-8")
        url = f"http://127.0.0.1:{settings.port}/api/playlists/{path.name}"
        return {
            "success": True,
            "message": f"playlist {path.name}: {stats['kept']} kept, {stats['excluded']} excluded",
            "playlist_url": url,
            "playlist_file": str(path),
            "stats": stats,
        }
    if op == "get_epg":
        guides = await _ensure("guides")
        rows = [g for g in guides if (not channel_id or g.get("channel") == channel_id)]
        if query:
            rows = [g for g in rows if query.lower() in (g.get("site_name", "") + g.get("channel", "")).lower()]
        return {"success": True, "message": f"{len(rows)} guides", "guides": rows[:50]}
    if op == "jellyfin_setup":
        built = await iptv(operation="build_playlist", country=country, category=category)
        guides = await _ensure("guides")
        guide_urls: list[str] = []
        for g in guides[:5]:
            for src in g.get("sources") or []:
                if src.get("url"):
                    guide_urls.append(src["url"])
        payload = jellyfin_handoff(built.get("playlist_url", ""), guide_urls[:3])
        payload["playlist_stats"] = built.get("stats", {})
        return payload
    if op == "play_in_vlc":
        settings = get_settings()
        target = stream_url
        if not target and channel_id:
            streams = await _ensure("streams")
            cand = next((s for s in streams if s.get("channel") == channel_id and s.get("url")), None)
            target = cand["url"] if cand else ""
        if not target:
            return {"success": False, "message": "no stream: pass stream_url or channel_id"}
        vlc = settings.vlc_path or "vlc"
        try:
            subprocess.Popen([vlc, target])
            return {"success": True, "message": f"launched in VLC: {target}", "url": target}
        except Exception as exc:
            return {"success": False, "message": f"VLC launch failed: {exc}", "url": target}
    return {"success": False, "message": f"unknown operation '{op}'"}
