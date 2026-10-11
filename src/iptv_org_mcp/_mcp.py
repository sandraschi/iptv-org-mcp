"""FastMCP singleton for iptv-org-mcp."""

import os
import threading

from fastmcp import FastMCP
from mcp.types import ToolAnnotations

DESCRIPTION = """# iptv-org MCP - free linear TV, curated

Discovery over the iptv-org static API (no key, CDN-cached): channels,
feeds, streams, guides (EPG), categories, languages, countries.
Builds health-filtered M3U playlists that hide dead/geo-blocked entries,
with one-click handoff to VLC (play) and Jellyfin Live TV (M3U + XMLTV).

Upstream: https://github.com/iptv-org/iptv (playlists), /database (channels),
/epg (guides), /api (static JSON). Only public stream links are used;
no video is stored or proxied. Blocklist + NSFW flags are respected by default.
"""

mcp = FastMCP("iptv-org-mcp", version="0.2.1", instructions=DESCRIPTION)


@mcp.resource("resource://iptv-org/legal")
def get_legal() -> str:
    """Legal boundary: upstream stores no video, only public links."""
    return (
        "iptv-org stores no video files, only user-submitted links to public streams. "
        "Respect blocklist.json (dmca/nsfw), is_nsfw flags, and Geo-blocked labels. "
        "This server never proxies video. See https://github.com/iptv-org/iptv#legal."
    )


@mcp.prompt()
def evening_news(country: str = "AT") -> str:
    """Starter prompt: build tonight's news playlist for a country."""
    return (
        f"Build a health-filtered evening-news playlist for country {country}: "
        'call iptv(operation="facets") to confirm the cache, then '
        'iptv(operation="build_playlist", country="'
        + country
        + '", category="news"). Quote kept/excluded counts and hand over the VLC paste path. '
        "If kept=0, widen category, drop probe, refresh, rebuild."
    )


@mcp.prompt()
def match_night(sport: str, country: str = "") -> str:
    """Starter prompt: verified sports streams for match night."""
    target = f" in {country}" if country else ""
    return (
        f"Find verified {sport} streams{target}: search_streams for {sport}, "
        "check_streams to probe liveness, then build_playlist with probe=true. "
        "Quote alive/total before handing over the playlist URL. Probing takes tens of seconds."
    )


@mcp.tool(
    annotations=ToolAnnotations(
        readOnlyHint=False,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=False,
    )
)
async def iptv_shutdown() -> dict:
    """Graceful self-termination for agents and the fleet launcher.

    ## Return Format
    Dialogic dict: {success, message}.

    ## Examples
    - shutdown before restart: {"tool": "iptv_shutdown"}
    """
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return {"success": True, "message": "iptv-org-mcp shutting down in ~500 ms"}
