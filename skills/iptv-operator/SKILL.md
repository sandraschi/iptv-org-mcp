---
name: iptv-operator
description: Find free linear TV channels, build health-filtered M3U playlists, play in VLC or import into Jellyfin Live TV.
---

# iptv-operator

Operate the iptv-org-mcp server: curated free linear TV. Upstream stores no
video, only public stream links. This server never proxies video.

## Workflow (always in this order)

1. **Facets** (`iptv(operation="facets")`): learn what countries/categories
   exist and how big the cache is. If the cache is cold, `refresh` first
   (one slow call, ~13 snapshots, 24h TTL).
2. **Search** (`search_channels`, query + country + category). NSFW hides by
   default; blocklisted channels never appear.
3. **Build** (`build_playlist`, country/category, `max_entries`). Default
   excludes blocklist, NSFW, Geo-blocked. `probe=true` keeps only
   HEAD-verified streams (capped by PROBE_MAX, slow by design).
4. **Watch**: paste the playlist URL into VLC (Media -> Open Network Stream),
   single channel via `play_in_vlc` (server machine only), or full import via
   `jellyfin_setup` (M3U tuner + XMLTV EPG + 5 steps).

## Rules

- Never promise a stream is alive. Offer `check_streams` or a probed rebuild.
- `include_nsfw=true` and `exclude_geo_blocked=false` are explicit user
  choices; state what they change.
- Narrow by country/category BEFORE probing. Probing thousands of streams
  is a self-DDoS; PROBE_MAX exists for a reason.
- `play_in_vlc` launches VLC on the server machine. Remote users get the
  playlist URL, not a play button that fires in the wrong room.
- Not every feed has EPG rows: check `get_epg` per channel before promising
  a Jellyfin guide. No rows = playback works, guide shows now/next only.

## Failure lines

- kept=0: "filters too tight — drop probe, widen country/category, refresh,
  rebuild."
- Black in VLC: "dead or geo-blocked — rebuild with probe=true or pick
  another feed for the same channel."
- No EPG: "no guide rows upstream for that channel."
