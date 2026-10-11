# TOOLS - iptv (portmanteau, 12 operations)

All calls go through one tool: `iptv(operation=...)`. Dialogic returns
`{success, message, ...}`.

| Operation | What it does |
|-----------|--------------|
| `facets` | categories + counts for the playlist builder |
| `search_channels` | text search + country/category/NSFW filter |
| `get_channel` | channel + feeds + streams + guides |
| `search_streams` | stream title search, geo-blocked hidden by default |
| `check_streams` | bounded HEAD probe for one query (best-effort) |
| `build_playlist` | curated M3U file + local URL (`/api/playlists/*.m3u`) |
| `get_epg` | guide rows (site + XMLTV source URLs) |
| `jellyfin_setup` | builds playlist + returns M3U + XMLTV + 5 steps |
| `play_in_vlc` | launch local VLC with a stream URL |
| `status` | loaded dataset counts |
| `refresh` | re-fetch upstream snapshots (24h TTL otherwise) |
| `help` | operation list |

## Second tool: `iptv_shutdown`

Graceful self-termination for agents and the fleet launcher (no args).
Returns `{success, message}` and exits ~500 ms later. REST twin:
`POST /api/shutdown` (same delayed-exit pattern).

## Prompts (`@mcp.prompt`)

| Prompt | Starter for |
|--------|-------------|
| `evening_news(country="AT")` | tonight's news playlist path |
| `match_night(sport, country="")` | verified sports build with probe |

## Examples

```python
await iptv(operation="facets")
await iptv(operation="search_channels", query="ORF", country="AT")
await iptv(operation="build_playlist", country="AT,DE", category="news", probe=True, max_entries=200)
await iptv(operation="jellyfin_setup", country="AT")
await iptv(operation="play_in_vlc", channel_id="ORF1.at")
```

`build_playlist` filters: blocklist (dmca/nsfw) always excluded, NSFW excluded
unless `include_nsfw=true`, `Geo-blocked` excluded by default, `Not 24/7`
kept unless excluded. `probe=true` HEAD-checks up to `PROBE_MAX` streams.
