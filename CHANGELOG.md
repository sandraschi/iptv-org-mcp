# Changelog

## 0.2.1 - 2026-10-11 (assfix)

* Backend: `GET /api/capabilities`, `/api/llm/providers`, `/api/llm/models`,
  `/api/llm/onboarding`, `POST /api/chat` + `/api/llm/chat/stream` (SSE),
  `POST /api/shutdown`; new `iptv_shutdown` tool; `evening_news` +
  `match_night` prompts; annotations + output_schema on tools; pyright-clean
  `_ensure` typing; logger.exception on VLC failures.
* Toolchain: `[dependency-groups]` dev (fixes broken `uv sync --group dev`),
  prefab-ui core dep, ruff T20; CI now runs ruff + pyright + pytest + biome +
  tsc + e2e job.
* Webapp: Chat meets P5 (100-msg cap, personalities, examples, export,
  skill-first, full testids); Dashboard live KPIs + red onboarding cue;
  Settings/AppLayout/Inbox/Skills/Tools/Channels/Guide/Playlists testids and
  text-sm pass; biome clean with scoped `biome ci ./src ./e2e`.
* Repo: session-injection channels (Claude Code, Cursor, Windsurf, Copilot,
  OpenCode, Antigravity), pre-commit config + biome hook, .gitattributes,
  vendored FleetStartMode, reports/ ignored, ports registered in fleet
  registry, glama/manifest versions at 0.2.0.

## 0.2.0 - 2026-10-08

* Full webapp (11241): Dashboard, Channels, Playlists, EPG Guide, Inbox,
  Tools (drill-down), Chat (local LLM proxy), Skills, API Docs, Logs,
  Settings (LLM+GPU), Help. tsc + biome + vite build green.
* Backend: /api/playlists list, /api/skills, /api/llm/* (discover,
  ollama_state, gpus, chat proxy), /api/iptv/* REST bridge, root landing.
* Launchers: web_sota/start.ps1 (dual-mode), starts mirror bat.
* Deferred P1: MCPB 3-4-100 prompts (v1 drafts shipped), e2e run in CI,
  cloud LLM providers in Chat.

## 0.2.0-bundle - 2026-10-08

* `.mcpb` ships: manifest v0.2, icon, canonical pack shim, 3-4-100 green
  (3020/4001/102), import/AST/pollution/launch checks pass, dist/ has
  versioned + stable + install.ps1. Release attach pending public repo.

## 0.1.0 - 2026-10-07

* Initial scaffold: iptv portmanteau (12 ops), M3U builder, EPG lookup,
  VLC launch, Jellyfin handoff, REST (/api/health, /api/tools,
  /api/playlists/*, /api/logs), CI, docs.
* Ports: backend 11242, frontend 11241 (reserved, Stage 2 webapp).
