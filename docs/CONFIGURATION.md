# CONFIGURATION - iptv-org-mcp

| Variable | Default | Notes |
|----------|---------|-------|
| `IPTV_ORG_MCP_HOST` | 127.0.0.1 | bind |
| `IPTV_ORG_MCP_PORT` | 11242 | backend |
| `IPTV_ORG_MCP_API_BASE` | https://iptv-org.github.io/api | mirror override |
| `IPTV_ORG_MCP_PLAYLIST_BASE` | https://iptv-org.github.io/iptv | reference only |
| `IPTV_ORG_MCP_CACHE_TTL_HOURS` | 24 | snapshot freshness |
| `IPTV_ORG_MCP_CACHE_DIR` | ./data | snapshots + `playlists/` |
| `IPTV_ORG_MCP_PROBE_TIMEOUT` | 8 | seconds per HEAD probe |
| `IPTV_ORG_MCP_PROBE_MAX` | 20 | cap per call (do not raise blindly) |
| `IPTV_ORG_MCP_VLC_PATH` | (empty = `vlc` on PATH) | player binary |

Probing 8000 streams at once is a self-DDoS. `probe=true` only checks the
candidate subset and is capped. For big sweeps, build country/category
playlists first, then `check_streams` per query.
