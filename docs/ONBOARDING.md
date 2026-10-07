# ONBOARDING - iptv-org-mcp

**Onboarding: nearly N/A.** No wrappee install, no account, no key. Upstream is
a public static CDN. Clone, `uv sync`, run. The only "setup" is optional:

1. **VLC** (optional, for one-click play): install from videolan.org. Either on
   PATH or set `IPTV_ORG_MCP_VLC_PATH`. Or just paste playlist URLs manually.
2. **Jellyfin** (optional, for guide + DVR): any running Jellyfin server.
   `jellyfin_setup` gives you the M3U + XMLTV URLs; you paste them into
   Jellyfin Dashboard -> Live TV. No plugin to install here.

Sanity check: `iptv(operation="facets")` returns categories; `build_playlist`
with `country="AT"` returns a playlist URL with kept > 0.
