# iptv-org-mcp - free linear TV, curated

FastMCP 3.4+ server for [iptv-org](https://github.com/iptv-org/iptv): 8000+ public
IPTV channels as searchable data + health-filtered M3U playlists. Solves the VLC
dead-channel pain: filter by country/category, hide Geo-blocked/NSFW/blocklisted,
optionally probe liveness, then play in VLC or import into Jellyfin Live TV.

Upstream stores **no video**, only public stream links (Unlicense/CC0). This server
never proxies video. Blocklist + NSFW respected by default.

## Quickstart

```powershell
uv sync
copy .env.example .env
uv run pytest -q
uv run python -m iptv_org_mcp --serve --port 11242
```

Backend **11242**, frontend **11241** (planned). Health: `http://127.0.0.1:11242/api/health`.
MCP: `http://127.0.0.1:11242/mcp` (streamable HTTP) or stdio for Claude Desktop.

## Claude Desktop

```json
{
  "mcpServers": {
    "iptv-org": {
      "command": "uv",
      "args": ["run", "python", "-m", "iptv_org_mcp", "--mode", "stdio"],
      "cwd": "D:/Dev/repos/iptv-org-mcp"
    }
  }
}
```

## The VLC pain, fixed

1. `iptv(operation="facets")` - what countries/categories exist
2. `iptv(operation="search_channels", query="ORF")` - find, no dead weight
3. `iptv(operation="build_playlist", country="AT,DE", probe=true)` - curated M3U URL
4. Paste URL into VLC (Media -> Open Network Stream) **or**
   `iptv(operation="play_in_vlc", channel_id="ORF1.at")` on the same machine
5. Jellyfin: `iptv(operation="jellyfin_setup", country="AT")` - M3U + XMLTV + steps

## Docs

* `docs/ONBOARDING.md` - no account needed (public CDN); VLC + Jellyfin setup
* `docs/TOOLS.md` - all operations with examples
* `docs/CONFIGURATION.md` - env vars, cache, probe tuning
* `INSTALL.md` - naked-PC install
* `docs/TROUBLESHOOTING.md` - dead streams, geo-blocks

## Ports

| Port | Service |
|------|---------|
| 11242 | Backend FastAPI + FastMCP `/mcp` |
| 11241 | Frontend (reserved, Stage 2) |

## Legal

Only public links. `blocklist.json` (dmca/nsfw) enforced. See `resource://iptv-org/legal`.
MIT (this wrapper). Upstream: Unlicense/CC0.
