# AGENTS.md - iptv-org-mcp

Stateless fetch-only FastMCP server (no SQLite/LanceDB). No daemon-proxy split.

* Backend 11242 (`iptv_org_mcp.server:app`), frontend 11241 reserved (Stage 2).
* Env prefix `IPTV_ORG_MCP_`, see `docs/CONFIGURATION.md`.
* Upstream: `https://iptv-org.github.io/api/*.json` (24h TTL in `./data`).
* Never proxy video. Respect blocklist/NSFW/Geo-blocked.
* Checks: `just lint`, `just test`, `just ci`.
