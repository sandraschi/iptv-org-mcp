# iptv-org-mcp - user prompt (v1: usage guide, P1 target 4000+ words)

## What this is

A curator for free linear TV. The iptv-org project collects publicly available
streams (news, sports, movies, music, regional) into M3U playlists and a JSON
API. This MCP server turns that raw pile — including hundreds of dead links —
into searchable channels and health-filtered playlists you can actually open.

## Everyday uses

### Austrian evening TV in VLC

"Find Austrian news channels" -> search_channels(query="", country="AT",
category="news") -> build_playlist(country="AT", category="news") -> paste the
returned URL into VLC via Media -> Open Network Stream. If a channel stays
black, rebuild with probe=true: only HEAD-verified streams survive.

### Sports Saturday

search_streams(query="sport") shows titles across countries. Geo-blocked labels
are hidden by default; many sports feeds are region-locked, so expect misses
and filter by your country first. Probe before match time, not during.

### Jellyfin Live TV (free DVR)

jellyfin_setup(country="AT") builds the playlist AND returns XMLTV guide URLs
plus 5 paste-steps: Jellyfin Dashboard -> Live TV -> M3U tuner -> EPG source ->
map -> refresh guide. Verify with jellyfin-mcp
jellyfin_livetv(operation='guide'). Recordings and DVR live in Jellyfin, not here.

### Expat / language TV

Build by language slice via category + country combos (e.g. news in DE/AT/CH
for German). There is no direct language filter on streams; channels carry
country + categories, which is the practical selector.

### EPG for one channel

get_epg(channel_id="ORF1.at") returns guide rows with XMLTV source URLs. No
rows = no guide upstream; playback still works, Jellyfin shows now/next only.

## The webapp (port 11241)

- Dashboard: KPIs + Build-a-playlist CTA.
- Channels: search with country/category dropdowns, NSFW toggle, client-side
  filter/sort, 20-per-page pagination, grid/list view.
- Playlists: builder (country, category, max entries, probe toggle), copy-URL
  buttons, history of built M3Us with sizes.
- EPG Guide: per-channel XMLTV lookup.
- Inbox: upstream refresh (slow, cached 24h) + fresh artifacts.
- Tools: live MCP surface with operation drill-down.
- Chat: local LLM (Ollama/LM Studio/vLLM) via backend proxy, history in
  localStorage. No provider = disabled state with install hint.
- Settings: backend health JSON, provider/model/GPU selects
  (data-testid llm-provider-select/llm-model-select/llm-gpu-select).
- Help: Start/VLC/Jellyfin/API/Errors/FAQ tabs. Logs: ring buffer with
  level + text filter.

## Limits you should know

Streams die and geo-blocks exist; kept/excluded stats on every build tell you
exactly how much survived. Probing is capped per call. Nothing here records,
transcodes or proxies video. Cloud LLMs are not offered: chat is local-only
by design. No skills shipped yet; the workflow above is the skill.
