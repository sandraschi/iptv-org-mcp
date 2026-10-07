# TROUBLESHOOTING - iptv-org-mcp

* **Empty playlist (kept=0)**: filters too tight. Drop `probe=true` first,
  widen country/category, check `status` after `refresh`.
* **VLC opens but nothing plays**: stream dead or geo-blocked from Austria.
  Run `check_streams` for that query, rebuild with `probe=true`.
* **Geo-blocked everywhere**: expected for some countries/labels. The server
  hides them by default; pass `exclude_geo_blocked=false` to see what exists.
* **Slow first call**: cold cache fetches ~13 JSON snapshots (channels is big).
  Later calls are instant until TTL expiry. Lower `CACHE_TTL_HOURS` only for dev.
* **Jellyfin sees no guide**: not every feed has a guide row. `get_epg` per
  channel first; use whatever XMLTV URLs exist.
