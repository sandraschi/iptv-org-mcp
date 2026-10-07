"""Jellyfin Live TV handoff: M3U + XMLTV instructions (no Jellyfin writes in v0.1)."""

from __future__ import annotations


def jellyfin_handoff(playlist_path_or_url: str, guide_urls: list[str]) -> dict:
    """Build the Jellyfin setup payload for a generated playlist.

    ## Return Format
    Dict with tuner (M3U) + epg source list + 5-step setup instructions.

    ## Examples
    >>> jellyfin_handoff("http://127.0.0.1:11242/api/playlists/at-de.m3u", ["https://example.com/g.xml"])
    """
    steps = [
        "Jellyfin Dashboard -> Live TV -> Add Tuner -> M3U Playlist",
        f"Paste M3U URL: {playlist_path_or_url}",
        "Add EPG source -> XMLTV URL (first guide below, or one per country)",
        "Map channels, then Refresh Guide Data",
        "Use jellyfin-mcp jellyfin_livetv(operation='guide') to verify",
    ]
    return {
        "success": True,
        "message": "Point Jellyfin Live TV at this playlist + guide",
        "tuner": {"type": "M3U", "url": playlist_path_or_url},
        "epg_sources": guide_urls,
        "steps": steps,
    }
