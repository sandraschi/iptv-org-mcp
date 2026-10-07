# CLAUDE.md - iptv-org-mcp

MCP: one portmanteau tool `iptv(operation=...)`. Start with `facets`, then
`search_channels`, then `build_playlist` (served at `/api/playlists/*.m3u`).
`jellyfin_setup` returns M3U + XMLTV + steps for jellyfin-mcp Live TV.
`play_in_vlc` launches local VLC only. No video proxying, ever.
