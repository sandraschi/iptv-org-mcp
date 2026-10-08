# iptv-org-mcp - user prompt (v1: usage guide, P1 target 4000+ words)

## What this is

A curator for free linear TV. The iptv-org project collects publicly available
streams (news, sports, movies, music, regional) into M3U playlists and a JSON
API. This MCP server turns that raw pile - including hundreds of dead links -
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
by design. The bundled iptv-operator skill (Skills page) encodes the
facets-first workflow above.

## Scenario cookbook (full dialogues)

### 1. Tuesday evening news in Vienna

You: "Austrian news for tonight."
Assistant: runs facets (confirms the news category id), then
search_channels with empty query, country AT, category news. It reads
back three to five channel names with stream counts, then
build_playlist with the same filters and quotes kept and excluded.
You: paste the playlist URL into VLC with Media, Open Network Stream,
and zap. Total time under two minutes once the cache is warm. If kept
is zero, the assistant drops the category and rebuilds the whole
Austrian slice before anything else, then narrows again.

### 2. Champions League night

You: "I need the match tonight, it has to work."
Assistant: search_streams for the competition or club name, filters to
your country first because sports feeds geo-block constantly, then
check_streams on the shortlist and reads alive versus total with
titles. Then it builds with probe=true so the M3U holds verified
entries only, and warns the probe takes tens of seconds. You open the
result ten minutes before kickoff, not at kickoff. If everything is
dead, it says so plainly and suggests the club's own free stream or
radio rather than inventing a link.

### 3. Expat German TV across three countries

You: "German-language news from Austria, Germany and Switzerland."
Assistant: builds country AT,DE plus category news (Switzerland often
rides along in the same feeds; a second CH pass covers the rest),
quotes both builds, and suggests keeping two small playlists instead
of one giant world list because small lists load faster in VLC and
fail more legibly. Language itself is not a stream filter - country
plus category is the practical selector, and the assistant says that
instead of pretending otherwise.

### 4. Kids-safe Saturday cartoons

You: "Cartoons for the kids, nothing adult."
Assistant: builds with defaults (NSFW already hidden, blocklist
enforced), category animation or kids, your country, max 100 entries,
and names the file so it is unmistakable. It never mixes an NSFW
opt-in build into the same URL. A second adult build, if wanted, is a
separate playlist with a separate name, and the assistant states the
difference out loud.

### 5. News wall: six countries at once

You: "Give me news from everywhere in Europe."
Assistant: builds per country group (for example AT,DE then UK then
FR,IT,ES) rather than one unbounded query, quotes each build's stats,
and hands over three to six paste-ready URLs. It caps each at 200
entries and explains that giants load slowly in VLC. This is also the
shape that maps cleanly into Jellyfin as separate tuners later.

### 6. Radio-style music streams for work

You: "Music channels to run in the background."
Assistant: category music, your country, no probe (music feeds are
stable and numerous), max 300. You paste into VLC, hit random, and
minimize. If one stutters, next track - the list is long enough that
no single death matters, and the assistant says exactly that.

### 7. Checking whether one channel has a guide

You: "Does ORF 1 have EPG data?"
Assistant: get_epg with channel ORF1.at, reads back site names and
XMLTV source URLs, or states plainly that no rows exist upstream. No
rows means playback still works and Jellyfin shows now and next only.
This check always precedes any promise about recordings.

### 8. Proving a stream is dead before complaining

You: "This channel never plays, is it me?"
Assistant: get_channel for the id, check_streams on its title, and
reads the verdict: all probes dead means upstream dead, mixed means
pick another feed, Geo-blocked labels mean region lock rather than
failure. Only then does it suggest the upstream issue tracker (database
repo for wrong links, epg repo for guide gaps) versus a local problem.

## Jellyfin deep setup (the whole path, no gaps)

Step zero is curation here, recording there - this server never
records. One: jellyfin_setup with your country gives you the M3U
tuner URL, up to three XMLTV URLs and five steps; read all three
before touching Jellyfin. Two: in Jellyfin, Dashboard, Live TV, Add
Tuner, M3U Playlist, paste the tuner URL, save. Three: Add EPG
source, XMLTV URL, paste the first guide URL, save; repeat per
country group. Four: map channels - Jellyfin auto-matches most, and
you fix the rest by hand against the channel names from get_channel.
Five: Refresh Guide Data and wait; the first pull is slow. Six:
verify with jellyfin-mcp guide lookup. Seven: set recording paths
and series rules inside Jellyfin, where DVR natively lives. When the
guide is thin, say so before mapping: no rows upstream means now and
next only, and no amount of refreshing invents data. When streams
die mid-season, rebuild the playlist with probe=true and swap the
tuner URL - mappings usually survive because ids are stable.

## VLC masterclass (getting the horrid UI under control)

VLC's raw iptv-org playlist is thousands of entries including dead
ones, which is exactly the pain this server removes. Always open a
built playlist, never the upstream index. Open Network Stream (Ctrl+N)
pastes the URL once; bookmark it with Playlist, Save Playlist to File
for one-click reopening. Sort the playlist view by title and the dead
hunt gets visual. For a single channel, the Channels page expander
shows each feed with quality and labels - pick a non-geo-blocked feed
and hit Play, or Copy URL for manual paste. Stutter on one feed means
next feed, not debugging: lists are long on purpose. Subtitles and
audio tracks, where the stream carries them, live under VLC's own
menus and are untouched by curation. Close VLC and the server keeps
nothing - state is URLs plus cache, and both rebuild.

## Curation masterclass (playlists that stay good)

Build narrow: one country group plus one category beats a world dump
every time, in load speed, in failure legibility and in Jellyfin
mapping sanity. Name builds by content (at-news, de-sports) because
the filename is the only label VLC shows. Probe before events, not
after failures: a probed build an hour early plus the unprobed build
as fallback covers match nights. Refresh weekly, not hourly -
upstream publishes daily and the TTL already handles freshness.
Exclude Not-24/7 only for background walls; keep it for browsing,
because part-time feeds are real channels with real schedules. Read
kept versus excluded as a health signal: a sudden drop means upstream
churn or new geo-blocks, and the fix is widening or re-probing, never
raising caps blindly. Archive builds that work (copy the M3U text)
before rebuilding for an event, so a bad rebuild is one paste away
from undo.

## Troubleshooting (twelve real cases)

1. Empty playlist, kept zero: filters too tight - drop probe, widen
   country and category, refresh, rebuild in that order.
2. VLC opens the list but nothing plays: dead or geo-blocked slice -
   check_streams the query, rebuild with probe=true.
3. One channel black, others fine: that feed died - open the channel
   expander and try the next feed before anything drastic.
4. Everything was fine yesterday: upstream churn - refresh and rebuild;
   ids are stable so Jellyfin mappings survive a URL swap.
5. Sports all geo-blocked: expected for rights-heavy feeds - filter to
   your country and accept the misses, or use official free streams.
6. Guide empty in Jellyfin: no rows upstream for those channels -
   verify with get_epg, set now-and-next expectations.
7. First call slow: cold cache fetching thirteen snapshots - later
   calls instant for 24 hours by design.
8. Play button does nothing visible: VLC runs on the server machine -
   remote users take Copy URL instead, always offered alongside.
9. Chat says no model: start Ollama or LM Studio, re-probe in
   Settings; the proxy only talks to loopback bases.
10. Logs page empty: start the backend through the launcher so
    lifespan sets the log level; hand-run servers may stay quiet.
11. Version mismatch after update: a second process holds the port -
    the launcher restarts stale backends automatically; hand-run ones
    must be killed once.
12. NSFW content visible unexpectedly: check whether include_nsfw was
    passed - the default hides it, and each build states its flags.

## FAQ (twelve honest answers)

Is this piracy? No: only freely available public streams, DMCA
blocklist enforced, nothing stored, nothing proxied. Why do channels
die? Volunteer curation plus rights churn plus part-time feeds; the
stats tell you how many survived. Do you record? Never - Jellyfin
does that after import. Do you transcode? Never - VLC and Jellyfin
handle playback. Why no login? Nothing here needs an account; there
are no keys in the entire system. Which countries work best? Large
curated slices (UK, US, DE, FR, AT) have the most feeds and the most
churn alike. Can I get subtitles? Wherever the stream carries them,
via VLC menus. Can I watch on my phone? Paste a playlist URL into a
mobile player, or use Jellyfin clients after import. Does it work
offline? No - streams are remote by nature; only the cache is local.
What does probe actually check? A HEAD request with ranged-GET
fallback, status under 400 inside the timeout, capped per call. Who
fixes wrong data? Upstream trackers (database for links, epg for
guides) - this server curates, it does not author. What costs money?
Nothing: public CDN, local compute, free players, optional Jellyfin
you host yourself.

## Client setup (where the assistant lives)

Claude Desktop over stdio is the primary client: command uv (or the
bundle python), args run python -m iptv_org_mcp --mode stdio, working
directory the repo. The distributed .mcpb bundle carries the manifest,
the staged package, the prompts and the icon - double-click install,
no accounts. Any MCP host works over streamable HTTP at POST /mcp on
the backend port. The browser needs no client at all: the REST bridge
plus the webapp cover facets, search, build, guide, playlists, logs
and local chat. Pick stdio for agent workflows, HTTP for services,
browser for evenings on the couch.

## Glossary in plain words

Channel is a curated entry like ORF1.at. Feed is one transmission
variant of it. Stream is one playable URL. Guide is EPG rows with
XMLTV sources. Playlist is a generated M3U plus its servable URL.
Probe is a bounded liveness check. Facets are the category, country
and count overview. Blocklist is upstream dmca and nsfw exclusions.
NSFW is flag-gated adult content. Geo-blocked is region-locked.
Not-24/7 is part-time. Handoff is the VLC or Jellyfin payload. Cache
is TTL-gated snapshots plus generated playlists on disk.

## Webapp tour (every page, what it is for)

Dashboard: the front door. Hero plus call to action, four KPI cards
(channels, playlists built, backend port, frontend port), the legal
one-liner, and three step cards (Find, Curate, Watch) linking deeper.
Start here after every refresh to confirm data is present.

Channels: the workhorse. Query box plus country and category controls
plus NSFW selector, a Search button, then client-side filter text,
name and country sort, twenty-per-page pagination with fetched-versus
filtered counts, and a grid-list toggle that persists. Every row shows
logo, name, id, country, categories and NSFW badge; the Streams button
expands feeds with title, quality and labels plus Play and Copy URL.
Use it for browsing and for proving one channel before building.

Playlists: the builder. Country and category inputs (comma lists),
max entries numeric, probe checkbox with the slowness warning, Build
button, then the result card with kept and excluded plus copyable URL
and the VLC and Jellyfin paste paths. Below, the history of built
M3Us with sizes, dates and per-file copy buttons. Use it for the
repeatable weekly builds.

EPG Guide: channel id plus site filter plus lookup. Rows show channel,
site name and every XMLTV source URL. Use it before promising any
Jellyfin guide, and to collect source URLs for manual tuner setups.

Inbox: freshness plus artifacts. The upstream refresh button (slow,
cached), the refresh result with per-dataset row counts, and the
recent-playlists list. Use it first after installs and weekly after.

Tools: the live MCP surface. One card per tool with description,
portmanteau badge and operation count, expandable to the full
description text, every operation chip and the starting hint. Use it
to learn the vocabulary the assistant speaks.

Chat: local LLM conversation. Provider and model status in the
header, message list with roles, input plus send, clear button, empty
state with examples, history persisted locally, disabled state with
the Ollama and LM Studio hint when nothing is detected. Use it for
guided curation in words.

Skills: bundled runbooks. One card per skill with name, URI and
description, expandable to the rendered markdown body. The
iptv-operator skill is the workflow in canonical form. Use it to
check what the assistant claims to know.

API Docs: Swagger and ReDoc iframes with a view toggle, open-in-new-tab
link and a quick reference strip of the nine most-used routes. Use it
to drive the backend by hand or from scripts.

Logs: the ring buffer. Level dropdown, text search, reload button,
record count, color-coded rows with logger names. Newest first, last
five hundred entries. Use it before reporting any bug.

Settings: health plus models. Backend health JSON verbatim, provider
dropdown with ports and model counts, model dropdown with loaded
badges, GPU selector on multi-GPU machines with the primary-stays-free
note, re-probe button, install hint when nothing is found. Use it
when chat misbehaves or after installing a new model.

Help: six tabs. Start (the five-step path), VLC (paste path, black
screen, executable config), Jellyfin (tuner, EPG, mapping, refresh,
verification), API plus ports (every route family), Fix errors (the
five common cases), FAQ (the four short answers). Use it instead of
guessing, then ask the assistant with the tab content in hand.

## Operation deep-dives (arguments that matter)

search_channels: query matches name plus id substrings; country
uppercases automatically so at and AT agree; category takes ids from
facets, not display names; the NSFW selector has three positions
(hide, all, only) in the webapp and a boolean plus blocklist in the
tool. Empty query with country and category returns the whole slice
up to the hundred-row cap — the standard way to survey a country.

build_playlist: countries and categories are comma lists; probe
defaults off for speed and on for events; max_entries defaults 200
because VLC slows past the low thousands; include_nsfw defaults off;
geo-blocked hides by default. The result always carries the servable
URL, the file path and kept versus excluded — read all three back.

check_streams versus probe: check_streams answers "is this query
alive" with up to twenty probes and no playlist; probe inside build
filters the playlist itself. Use the first for diagnosis, the second
for events. Both are best-effort: dead means dead, blocked or slow,
and the assistant states the evidence rather than the verdict.

jellyfin_setup: country plus optional category in, tuner URL plus up
to three EPG URLs plus five steps plus playlist stats out. It builds
first, so its stats are the build stats — quote them. EPG URLs come
from the first guide rows found, so a thin-guide country yields
fewer sources and the assistant says so.

play_in_vlc: channel id picks the first stream, stream URL plays
exactly it, empty input returns success false with guidance. The
binary resolves from VLC_PATH or PATH; failures return the URL so
manual paste always rescues the session.

## Dataset fields (what each row carries)

Channels carry id, name, country, subdivision, city, broadcast area,
languages, categories, NSFW flag, website and logo. Streams carry
channel, title, URL, quality and labels. Guides carry channel, site,
site name and XMLTV sources. Feeds carry channel and format detail.
Categories carry id and name. Languages carry code and name.
Countries carry name, code and flag. Blocklist rows carry channel and
reason. Logos map channels to images. Subdivisions, cities, regions
and timezones refine geography. The cache directory holds one file
per dataset plus the playlists folder; every file is plain JSON or
M3U and inspectable by hand when debugging.

## Ten evenings (one-paragraph builds)

Austrian news: country AT, category news, no probe, paste and zap.
German movies: countries AT,DE, category movies, max 300, evening
browsing. UK documentaries: country UK, query docs via search first,
then build the shortlist. French sports: country FR, category
sports, probe on, expect geo-blocks and keep the survivors. Italian
music: country IT, category music, no probe, shuffle in VLC. Spanish
kids: country ES, category kids or animation, max 100, safe-named
file. US late night: country US, no category, max 500, browse the
wall. Swiss mixed: country CH, no category, small curious list.
Arabic news: search by name fragment, build from the hits, verify
with check_streams. World news wall: one build per region group,
three to six URLs, never a single giant.

## Reading the stats (what kept and excluded mean)

Kept near max_entries with low excluded means a healthy slice —
paste and enjoy. High excluded with Geo-blocked labels means rights
territory, not breakage — filter tighter or accept it. High excluded
after probing means upstream rot in that slice — try neighboring
countries or categories. Kept zero with probe on means everything
died or blocked — rebuild without probe to see the raw slice, then
decide. Kept zero without probe means filters contradict (unknown
category id, empty country slice) — run facets and re-check the ids.
Excluded climbing week over week means churn — refresh, rebuild, and
compare; mappings survive because channel ids are stable. Quoting
both numbers every time is what makes the assistant trustworthy:
never "here is your playlist" without "kept 143, excluded 61".

## Driving it without the webapp (HTTP and MCP paths)

Every webapp action is a REST call you can repeat from scripts. GET
facets for counts, GET search with query params for channels, GET
playlist with country and probe flags for builds, GET epg and channel
for detail, POST play with a JSON body for VLC, POST refresh for the
slow warmup. Health, tools, playlists, skills and logs are plain GETs
with JSON envelopes. Any MCP client speaks the same twelve operations
over stdio locally or streamable HTTP on the backend port: help,
status, refresh, facets, search_channels, get_channel, search_streams,
check_streams, build_playlist, get_epg, jellyfin_setup, play_in_vlc.
Scripted weekly rebuilds hit GET playlist with fixed country strings
and log kept versus excluded; scripted health checks hit facets and
alert when channel_count drops unexpectedly. The Swagger UI documents
every route live, and the schema endpoint feeds code generators.

## Playlist file anatomy (reading your M3U)

The first line is always EXTINF-marker EXT M3U. Each entry is two
lines: an EXTINF line with duration minus one (stream, not file),
tvg-id carrying the channel id for Jellyfin mapping, group-title
carrying the first category for VLC grouping, then the display name;
followed by the raw stream URL. Entries appear in upstream order up
to max_entries. No credentials, no tokens, no expiry timestamps live
in the file — staleness comes from upstream churn, which is why
rebuilds exist. Open it in any text editor to audit exactly what a
build kept before pasting it anywhere.

## When to use what (the decision list)

Browse: Channels page or search_channels. One channel now: channel
expander plus Play, or play_in_vlc. Reusable list: Playlists builder
or build_playlist, never the upstream index. Event that must work:
probe on plus fallback build. Recordings: jellyfin_setup then
Jellyfin, never this server. Guide questions: get_epg per channel
first. Dead hunt: check_streams, then upstream trackers. Fresh data:
Inbox refresh or POST refresh, weekly. Bugs: Logs page filtered by
level, then the exact route plus error text. Learning: Tools page or
help operation, then the skill body. Evenings: browser and VLC. Agents
and scripts: MCP operations or REST. Installs elsewhere: the bundle.

## Twelve starter slices (copy these filters)

Austria news: country AT plus category news — the home slice this
server was built around. Germany mixed: country DE, no category, max
300 — the deepest European catalogue. United Kingdom: country UK,
category of choice — huge but churny, probe for events. France:
country FR — strong movies and news, frequent geo-blocks on sports.
Italy: country IT — music and generalist feeds, stable. Spain:
country ES — kids and generalist slices behave well. Switzerland:
country CH — small, curious, multilingual by nature. United States:
country US — the wall of everything, cap at 500. Canada: country CA
— calmer northern mix. Australia: country AU — mornings in Europe
are their evenings, schedules shift. Brazil: country BR — Portuguese
language bulk. Japan: country JP — night-owl variety from Vienna.
Each is one build call or one Playlists form submit; quote stats,
paste, watch.

## Bundle, updates and versions (staying current)

The .mcpb bundle installs into Claude Desktop with a double click —
manifest, staged package, prompts and icon travel together, and the
stdio entry needs no ports. Update by installing the newer bundle;
playlists rebuild deterministically, so nothing curated is lost.
Report the running version from health or the landing page with every
bug report, because stale backends are the first suspect and the
launcher now restarts them automatically. Upstream data refreshes
daily while this text stays valid across refreshes — filters and ids
are stable, only stream liveness churns. When this guide and the
Skills page disagree, the skill wins: it ships with the running code.

Start tonight with one build: your country, news, no probe. Paste it,
zap through it, and notice how short the dead list has become. That
single playlist is the whole product - everything else here is its
care and feeding, and the assistant exists to repeat this evening
forever without surprises. Enjoy the zapper again. Channels change, guides
update, players evolve; curated links plus honest stats stay useful regardless.
