# INSTALL - iptv-org-mcp

## Requirements

* Windows 10/11, Python 3.12+, `uv`
* Optional: VLC (for `play_in_vlc`), Jellyfin server (for Live TV import)
* No API keys. No accounts. Upstream is a public CDN.

## Steps

```powershell
git clone https://github.com/sandraschi/iptv-org-mcp
cd iptv-org-mcp
uv sync
copy .env.example .env
uv run pytest -q
.\start.ps1 -BackendOnly
```

Verify: `http://127.0.0.1:11242/api/health` returns `{"status":"ok",...}`.

## VLC

Install VLC from https://www.videolan.org. `play_in_vlc` uses `vlc` on PATH
or `IPTV_ORG_MCP_VLC_PATH`. Or paste any `/api/playlists/*.m3u` URL into
VLC -> Media -> Open Network Stream.

## Jellyfin

Jellyfin Dashboard -> Live TV -> Add M3U tuner (paste playlist URL) ->
Add XMLTV EPG source (from `jellyfin_setup`) -> Map -> Refresh Guide.
