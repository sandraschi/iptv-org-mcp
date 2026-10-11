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

Frontend:

```powershell
cd web_sota
bun install
bun run dev
```

Or double-click `start.bat` (backend + frontend, ports 11242/11241).

Backend **11242**, frontend **11241** (Vite dashboard: Channels, Playlists, EPG, Tools, Chat, Logs, Settings, Help). Health: `http://127.0.0.1:11242/api/health`.
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
| 11241 | Frontend (Vite dashboard) |

Registered in `mcp-central-docs/operations/WEBAPP_PORTS.md`.

## Stack

Backend: Python 3.12+, FastMCP 3.4.x, FastAPI, uvicorn, httpx, pydantic v2,
prefab-ui. Frontend (`web_sota/`): React 19 + Vite 6 + TailwindCSS 3 +
Lucide + Framer Motion + Zustand + React Router, installed via Bun
(`bun.lock` committed; Node.js still required as Vite runs on Node).
Lint: ruff (T20) + pyright + biome + tsc. Tests: pytest (30% gate) + Playwright smoke.

## MCP surface

Portmanteau `iptv` (12 ops: facets, search_channels, get_channel,
search_streams, check_streams, build_playlist, get_epg, jellyfin_setup,
play_in_vlc, status, refresh, help) plus `iptv_shutdown`, 2 prompts
(`evening_news`, `match_night`), 1 resource (`resource://iptv-org/legal`).

## Legal

Only public links. `blocklist.json` (dmca/nsfw) enforced. See `resource://iptv-org/legal`.
MIT (this wrapper). Upstream: Unlicense/CC0.

## Distribution (.mcpb bundle)

`just mcpb-pack` runs the fleet pack pipeline (wipe+recopy, import/AST/
pollution checks, 3-4-100 prompt gate, pack, launch-from-clean-unpack
proof) and writes `dist/`:

* `iptv-org-mcp-v0.2.1.mcpb` - versioned archive
* `iptv-org-mcp.mcpb` - stable name for `releases/latest/download/`
* `install.ps1` - Claude Desktop one-liner installer (generated, SHA256-pinned)

Latest release (v0.2.1) carries all three assets. One-line install:

```powershell
irm https://github.com/sandraschi/iptv-org-mcp/releases/latest/download/install.ps1 | iex
```
