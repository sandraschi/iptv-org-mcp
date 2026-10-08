# Changelog

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
