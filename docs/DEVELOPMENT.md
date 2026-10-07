# DEVELOPMENT - iptv-org-mcp

```powershell
uv sync
uv run pytest -q
uv run ruff check src tests
uv run python -m iptv_org_mcp --serve --port 11242
```

Layout: `src/iptv_org_mcp/server.py` (gateway), `_mcp.py` (singleton),
`tools/iptv_tools.py` (portmanteau), `services/` (fetch/cache/playlist/health).
Stateless fetch-only server: no SQLite, no daemon-proxy split needed.

Add a dataset: extend `_JSON_FILES` in `services/api_client.py`, add to
`refresh` list, seed in tests. Keep filters in `services/playlist.py`
pure (no network) so they stay unit-testable.
