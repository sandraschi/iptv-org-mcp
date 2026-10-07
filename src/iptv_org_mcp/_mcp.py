"""FastMCP singleton for iptv-org-mcp."""

from fastmcp import FastMCP

DESCRIPTION = """# iptv-org MCP - free linear TV, curated

Discovery over the iptv-org static API (no key, CDN-cached): channels,
feeds, streams, guides (EPG), categories, languages, countries.
Builds health-filtered M3U playlists that hide dead/geo-blocked entries,
with one-click handoff to VLC (play) and Jellyfin Live TV (M3U + XMLTV).

Upstream: https://github.com/iptv-org/iptv (playlists), /database (channels),
/epg (guides), /api (static JSON). Only public stream links are used;
no video is stored or proxied. Blocklist + NSFW flags are respected by default.
"""

mcp = FastMCP("iptv-org-mcp", version="0.2.0", instructions=DESCRIPTION)


@mcp.resource("resource://iptv-org/legal")
def get_legal() -> str:
    """Legal boundary: upstream stores no video, only public links."""
    return (
        "iptv-org stores no video files, only user-submitted links to public streams. "
        "Respect blocklist.json (dmca/nsfw), is_nsfw flags, and Geo-blocked labels. "
        "This server never proxies video. See https://github.com/iptv-org/iptv#legal."
    )
