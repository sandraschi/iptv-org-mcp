"""M3U playlist builder with blocklist/NSFW/geo filters."""

from __future__ import annotations


def _passes(
    stream: dict,
    channel_by_id: dict,
    *,
    countries: list[str] | None,
    categories: list[str] | None,
    languages: dict[str, list[str]] | None,
    exclude_geo_blocked: bool,
    exclude_not_247: bool,
    include_nsfw: bool,
    blocked: set[str],
) -> bool:
    ch_id = stream.get("channel")
    if ch_id in blocked:
        return False
    ch = channel_by_id.get(ch_id, {})
    if ch.get("is_nsfw") and not include_nsfw:
        return False
    if countries and (ch.get("country") or "") not in countries:
        return False
    if categories:
        cats = ch.get("categories") or []
        if not any(c in cats for c in categories):
            return False
    labels = stream.get("labels") or []
    if exclude_geo_blocked and "Geo-blocked" in labels:
        return False
    if exclude_not_247 and "Not 24/7" in labels:
        return False
    return True


def build_m3u(
    streams: list[dict],
    channels: list[dict],
    *,
    countries: list[str] | None = None,
    categories: list[str] | None = None,
    exclude_geo_blocked: bool = True,
    exclude_not_247: bool = False,
    include_nsfw: bool = False,
    max_entries: int = 500,
) -> tuple[str, dict]:
    """Build an M3U string from filtered streams.

    ## Return Format
    Tuple (m3u_text, stats dict with kept/excluded counts).

    ## Examples
    m3u, stats = build_m3u(streams, channels, countries=["AT", "DE"])
    """
    from iptv_org_mcp.services.store import get_blocked_ids  # lazy, test-seeded

    channel_by_id = {c.get("id"): c for c in channels if isinstance(c, dict)}
    blocked = get_blocked_ids()
    lines = ["#EXTM3U"]
    kept = 0
    excluded = 0
    for s in streams:
        if kept >= max_entries:
            break
        if not isinstance(s, dict) or not s.get("url"):
            excluded += 1
            continue
        if not _passes(
            s,
            channel_by_id,
            countries=countries,
            categories=categories,
            languages=None,
            exclude_geo_blocked=exclude_geo_blocked,
            exclude_not_247=exclude_not_247,
            include_nsfw=include_nsfw,
            blocked=blocked,
        ):
            excluded += 1
            continue
        title = s.get("title") or s.get("channel") or "Unknown"
        ch = channel_by_id.get(s.get("channel"), {})
        group = (ch.get("categories") or ["general"])[0]
        lines.append(f'#EXTINF:-1 tvg-id="{s.get("channel", "")}" group-title="{group}",{title}')
        lines.append(s["url"])
        kept += 1
    stats = {"kept": kept, "excluded": excluded, "max_entries": max_entries}
    return "\n".join(lines) + "\n", stats
