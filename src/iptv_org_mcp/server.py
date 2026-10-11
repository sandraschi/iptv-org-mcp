"""Unified gateway: FastAPI REST + FastMCP streamable HTTP on one port."""

import asyncio
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse

from iptv_org_mcp import tools  # noqa: F401  (tool registration side-effect)
from iptv_org_mcp._mcp import mcp
from iptv_org_mcp.config import get_settings
from iptv_org_mcp.errors import _error_response
from iptv_org_mcp.logging_ring import get_ring_handler, install_ring_handler
from iptv_org_mcp.tools.iptv_tools import iptv as _iptv_tool

logger = logging.getLogger("iptv-org-mcp")
_START_TIME = time.time()
_MCP_PATH = "/mcp"
_mcp_http = mcp.http_app(path=_MCP_PATH)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: log level + ring handler, report config (no network on boot)."""
    install_ring_handler()
    logging.getLogger().setLevel(get_settings().log_level)
    settings = get_settings()
    logger.info("iptv-org MCP startup - backend=%s api=%s", settings.port, settings.api_base)
    async with _mcp_http.lifespan(app):
        yield


app = FastAPI(lifespan=lifespan, title="iptv-org MCP", version="0.2.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:11241",
        "http://localhost:11241",
        "http://127.0.0.1:11242",
        "http://localhost:11242",
        "http://tauri.localhost",
        "https://tauri.localhost",
        "tauri://localhost",
    ],
    allow_origin_regex=r"https?://(?:localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|100\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$|^tauri://localhost$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Log full traceback, return dialogic error."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return _error_response(str(exc), "internal")


@app.get("/api/health")
async def api_health():
    """Liveness probe for start.ps1 and the frontend health dot."""
    return {
        "status": "ok",
        "server": "iptv-org MCP",
        "version": "0.2.1",
        "uptime_seconds": int(time.time() - _START_TIME),
        "tool_count": len(await mcp.list_tools()),
    }


@app.get("/api/tools")
async def api_tools():
    """Dynamic MCP tool list (never hardcoded)."""
    tool_list = await mcp.list_tools()
    tools_out = []
    for t in tool_list:
        entry: dict = {"name": t.name, "description": t.description}
        if t.name == "iptv":
            try:
                help_res = await _iptv_tool(operation="help")
                entry["operations"] = help_res.get("operations", [])
                entry["hint"] = help_res.get("hint", "")
            except Exception:
                entry["operations"] = []
        tools_out.append(entry)
    return {"success": True, "data": {"tools": tools_out, "count": len(tools_out)}}


@app.get("/api/capabilities")
async def api_capabilities():
    """Standard capability surface for the webapp and fleet discovery."""
    tool_list = await mcp.list_tools()
    return {
        "success": True,
        "data": {
            "server": "iptv-org MCP",
            "version": "0.2.1",
            "transports": ["stdio", "streamable-http"],
            "mcp_path": "/mcp",
            "tools": [{"name": t.name, "description": t.description} for t in tool_list],
            "features": {
                "playlists": True,
                "epg": True,
                "llm_proxy": True,
                "skills": True,
                "vlc_handoff": True,
                "jellyfin_handoff": True,
            },
        },
    }


@app.get("/api/playlists/{name}")
async def api_playlist(name: str):
    """Serve a generated M3U playlist by filename."""
    safe = Path(name).name
    path = Path(get_settings().cache_dir) / "playlists" / safe
    if not path.exists():
        return _error_response(f"playlist '{safe}' not found; call iptv build_playlist first", "not_found")
    return PlainTextResponse(path.read_text(encoding="utf-8"), media_type="audio/x-mpegurl")


@app.get("/api/logs")
async def api_logs(level: str | None = None, search: str | None = None, limit: int = 100):
    """Ring-buffer log window."""
    records = get_ring_handler().snapshot(level=level, search=search, limit=min(max(limit, 1), 500))
    return {"success": True, "data": {"records": records, "count": len(records)}}


@app.get("/", include_in_schema=False)
async def api_root():
    """Landing page: server info + useful links (browsers hit this first)."""
    settings = get_settings()
    return {
        "server": "iptv-org MCP",
        "version": "0.2.1",
        "message": "use /api/health, /api/tools, or POST /mcp",
        "links": {
            "health": "/api/health",
            "tools": "/api/tools",
            "logs": "/api/logs",
            "mcp": "/mcp",
            "playlist_example": "/api/playlists/at.m3u",
        },
        "ports": {"backend": settings.port, "frontend": 11241},
    }


@app.get("/api/iptv/facets")
async def api_iptv_facets():
    """Browser-friendly alias for iptv(operation='facets')."""
    return await _iptv_tool(operation="facets")


@app.get("/api/iptv/search")
async def api_iptv_search(query: str = "", country: str = "", category: str = ""):
    """Browser-friendly alias for iptv(operation='search_channels')."""
    return await _iptv_tool(operation="search_channels", query=query, country=country, category=category)


@app.get("/api/iptv/playlist")
async def api_iptv_playlist(country: str = "", category: str = "", probe: bool = False, max_entries: int = 200):
    """Browser-friendly alias for iptv(operation='build_playlist')."""
    return await _iptv_tool(
        operation="build_playlist",
        country=country,
        category=category,
        probe=probe,
        max_entries=max_entries,
    )


@app.get("/api/iptv/epg")
async def api_iptv_epg(channel_id: str = "", query: str = ""):
    """Browser-friendly alias for iptv(operation='get_epg')."""
    return await _iptv_tool(operation="get_epg", channel_id=channel_id, query=query)


@app.get("/api/iptv/channel")
async def api_iptv_channel(channel_id: str = ""):
    """Channel detail: feeds + playable streams + guides."""
    return await _iptv_tool(operation="get_channel", channel_id=channel_id)


@app.post("/api/iptv/play")
async def api_iptv_play(body: dict):
    """Launch local VLC with a channel's stream (server machine only)."""
    return await _iptv_tool(
        operation="play_in_vlc",
        channel_id=str(body.get("channel_id", "")),
        stream_url=str(body.get("stream_url", "")),
    )


@app.post("/api/iptv/refresh")
async def api_iptv_refresh():
    """Fetch fresh upstream snapshots (cold-cache warmup)."""
    return await _iptv_tool(operation="refresh")


@app.get("/api/playlists")
async def api_playlists():
    """List generated M3U playlists (newest first)."""
    d = Path(get_settings().cache_dir) / "playlists"
    if not d.is_dir():
        return {"success": True, "data": {"playlists": [], "count": 0}}
    rows = []
    for p in sorted(d.glob("*.m3u"), key=lambda x: x.stat().st_mtime, reverse=True):
        rows.append(
            {
                "name": p.name,
                "url": f"/api/playlists/{p.name}",
                "size_bytes": p.stat().st_size,
                "modified": p.stat().st_mtime,
            }
        )
    return {"success": True, "data": {"playlists": rows, "count": len(rows)}}


@app.get("/api/skills")
async def api_skills():
    """Skill list from skills/*/SKILL.md (name + description)."""
    out = []
    skills_dir = Path(__file__).resolve().parent.parent.parent / "skills"
    if skills_dir.is_dir():
        for md in sorted(skills_dir.glob("*/SKILL.md")):
            meta = _parse_skill_md(md)
            out.append({"name": md.parent.name, "uri": f"skill://{md.parent.name}", **meta})
    return {"success": True, "data": {"skills": out, "count": len(out)}}


def _parse_skill_md(path: Path) -> dict:
    """Extract name/description from SKILL.md frontmatter (best-effort)."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return {}
    if not text.startswith("---"):
        return {}
    head = text.split("---", 2)
    if len(head) < 3:
        return {}
    meta: dict[str, str] = {}
    for line in head[1].splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return {k: meta[k] for k in ("name", "description") if k in meta}


@app.get("/api/skills/{skill_name}")
async def api_skill_content(skill_name: str):
    """Return a SKILL.md body by directory name."""
    if not skill_name.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="invalid skill name")
    path = Path(__file__).resolve().parent.parent.parent / "skills" / skill_name / "SKILL.md"
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"skill '{skill_name}' not found")
    meta = _parse_skill_md(path)
    return {
        "success": True,
        "data": {"name": skill_name, "content": path.read_text(encoding="utf-8"), **meta},
    }


_LLM_PROVIDERS: list[dict] = [
    {"name": "ollama", "base": "http://127.0.0.1:11434", "models_path": "/api/tags"},
    {"name": "lmstudio", "base": "http://127.0.0.1:1234", "models_path": "/v1/models"},
    {"name": "vllm", "base": "http://127.0.0.1:8000", "models_path": "/v1/models"},
]


async def _discover_providers() -> list[dict]:
    """Probe local LLM providers (Ollama / LM Studio / vLLM)."""
    discovered = []
    async with httpx.AsyncClient(timeout=3) as client:
        for provider in _LLM_PROVIDERS:
            try:
                r = await client.get(provider["base"] + provider["models_path"])
                if r.status_code != 200:
                    continue
                payload = r.json()
                if provider["name"] == "ollama":
                    models = [m["name"] for m in payload.get("models", []) if isinstance(m, dict)]
                else:
                    models = [m["id"] for m in payload.get("data", []) if isinstance(m, dict)]
                discovered.append(
                    {
                        "name": provider["name"],
                        "base": provider["base"],
                        "port": int(provider["base"].rsplit(":", 1)[1]),
                        "models": models[:50],
                    }
                )
            except Exception:
                continue
    return discovered


@app.get("/api/llm/discover")
async def api_llm_discover():
    """Probe local LLM providers (Ollama / LM Studio / vLLM) for Settings + Chat."""
    discovered = await _discover_providers()
    return {"success": True, "data": {"providers": discovered, "count": len(discovered)}}


@app.get("/api/llm/providers")
async def api_llm_providers():
    """Provider registry: local detected flags + cloud configured flags (never keys)."""
    discovered = await _discover_providers()
    by_name = {p["name"]: p for p in discovered}
    out = []
    for name, base in (
        ("ollama", "http://127.0.0.1:11434"),
        ("lmstudio", "http://127.0.0.1:1234"),
        ("vllm", "http://127.0.0.1:8000"),
    ):
        hit = by_name.get(name)
        out.append(
            {
                "name": name,
                "local": hit is not None,
                "configured": hit is not None,
                "base": base,
                "models": hit["models"] if hit else [],
            }
        )
    for name in ("openai", "anthropic"):
        out.append({"name": name, "local": False, "configured": False, "base": "", "models": []})
    return {"success": True, "data": {"providers": out, "count": len(out)}}


@app.get("/api/llm/models")
async def api_llm_models(provider: str = "ollama"):
    """Model list for one provider: live when reachable, honest empty otherwise."""
    discovered = await _discover_providers()
    hit = next((p for p in discovered if p["name"] == provider.lower()), None)
    if hit is not None:
        return {"success": True, "data": {"provider": hit["name"], "models": hit["models"], "live": True}}
    return {
        "success": True,
        "data": {
            "provider": provider.lower(),
            "models": [],
            "live": False,
            "hint": "provider not reachable - start Ollama/LM Studio or pick another provider",
        },
    }


@app.get("/api/llm/onboarding")
async def api_llm_onboarding():
    """Fresh-install starter facts + recommended path for the under-hero cue."""
    return {
        "success": True,
        "data": {
            "facts": [
                "No account or key needed: channel data comes from the public iptv-org CDN.",
                "VLC plays the generated M3U URL (Media -> Open Network Stream).",
                "Jellyfin Live TV imports the M3U tuner plus XMLTV guide URLs.",
                "Streams die or geo-block: rebuild with probe=true when playback is black.",
            ],
            "recommended_path": "facets -> search_channels -> build_playlist -> VLC or jellyfin_setup",
        },
    }


@app.get("/api/llm/ollama_state")
async def api_llm_ollama_state():
    """Ollama resident-first state: loaded models (/api/ps) + installed (/api/tags)."""
    base = "http://127.0.0.1:11434"
    loaded: list[str] = []
    installed: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            ps = await client.get(base + "/api/ps")
            if ps.status_code == 200:
                loaded = [m["name"] for m in ps.json().get("models", []) if isinstance(m, dict)]
            tags = await client.get(base + "/api/tags")
            if tags.status_code == 200:
                installed = [m["name"] for m in tags.json().get("models", []) if isinstance(m, dict)]
    except Exception:
        pass
    return {"success": True, "data": {"loaded": loaded, "installed": installed}}


@app.get("/api/llm/gpus")
async def api_llm_gpus():
    """Enumerate NVIDIA GPUs via nvidia-smi (empty on non-NVIDIA)."""
    import asyncio as _asyncio

    gpus: list[dict] = []
    try:
        proc = await _asyncio.create_subprocess_exec(
            "nvidia-smi",
            "--query-gpu=index,name,memory.total",
            "--format=csv,noheader,nounits",
            stdout=_asyncio.subprocess.PIPE,
            stderr=_asyncio.subprocess.DEVNULL,
        )
        out, _ = await _asyncio.wait_for(proc.communicate(), timeout=5)
        for line in out.decode().strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) == 3:
                gpus.append({"index": int(parts[0]), "name": parts[1], "vramMb": int(float(parts[2]))})
    except Exception:
        pass
    return {"success": True, "data": {"gpus": gpus, "count": len(gpus)}}


async def _proxy_chat(provider: str, model: str, messages: list, base: str | None) -> dict:
    """Shared backend chat proxy (loopback bases only, keys never leave the server)."""
    bases = {
        "ollama": "http://127.0.0.1:11434",
        "lmstudio": "http://127.0.0.1:1234",
        "vllm": "http://127.0.0.1:8000",
    }
    resolved = base or bases.get(provider, bases["ollama"])
    if not resolved.startswith(("http://127.0.0.1:", "http://localhost:")):
        return _error_response("only loopback LLM bases are allowed", "forbidden")
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(
                f"{resolved}/v1/chat/completions",
                json={"model": model, "messages": messages, "stream": False},
            )
    except Exception as exc:
        return _error_response(f"LLM backend unreachable at {resolved}: {exc}", "llm_down")
    if r.status_code != 200:
        return _error_response(f"LLM backend returned {r.status_code}: {r.text[:200]}", "llm_error")
    return {"success": True, "data": r.json()}


@app.post("/api/llm/chat")
async def api_llm_chat(body: dict):
    """Proxy chat completions to a local provider (never expose keys; none needed).

    Body: {provider, model, messages, base?}. Only loopback bases allowed.
    """
    provider = (body.get("provider") or "ollama").lower()
    return await _proxy_chat(provider, body.get("model", ""), body.get("messages", []), body.get("base"))


@app.post("/api/chat")
async def api_chat(body: dict):
    """Canonical chat endpoint (alias over the local-LLM proxy). Body: {messages, provider?, model?, base?}."""
    provider = (body.get("provider") or "ollama").lower()
    return await _proxy_chat(provider, body.get("model", ""), body.get("messages", []), body.get("base"))


@app.post("/api/llm/chat/stream")
async def api_llm_chat_stream(body: dict):
    """Streaming chat proxy (SSE, OpenAI-style chunks). Body: {provider, model, messages, base?}."""
    provider = (body.get("provider") or "ollama").lower()
    model = body.get("model", "")
    messages = body.get("messages", [])
    bases = {
        "ollama": "http://127.0.0.1:11434",
        "lmstudio": "http://127.0.0.1:1234",
        "vllm": "http://127.0.0.1:8000",
    }
    resolved = body.get("base") or bases.get(provider, bases["ollama"])
    if not resolved.startswith(("http://127.0.0.1:", "http://localhost:")):
        return _error_response("only loopback LLM bases are allowed", "forbidden")

    async def gen():
        try:
            async with httpx.AsyncClient(timeout=180) as client:
                async with client.stream(
                    "POST",
                    f"{resolved}/v1/chat/completions",
                    json={"model": model, "messages": messages, "stream": True},
                ) as r:
                    if r.status_code != 200:
                        yield f'data: {{"error": "LLM backend returned {r.status_code}"}}\n\n'
                        return
                    async for line in r.aiter_lines():
                        text = line.strip()
                        if not text:
                            continue
                        if text.startswith("data:"):
                            yield text + "\n\n"
                        else:
                            yield f"data: {text}\n\n"
        except Exception as exc:
            yield f'data: {{"error": "LLM backend unreachable at {resolved}: {exc}"}}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/api/shutdown")
async def api_shutdown():
    """Orderly exit for the fleet launcher: respond 200, then exit ~500 ms later."""
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return {"success": True, "message": "iptv-org-mcp shutting down in ~500 ms", "data": {}}


@app.get("/favicon.ico", include_in_schema=False)
async def api_favicon():
    """Silence browser favicon noise with a 204."""
    from fastapi import Response

    return Response(status_code=204)


app.mount("/", _mcp_http)


async def _run_stdio():
    await mcp.run_stdio_async()


def resolve_runtime(mode_arg: str, port_arg: int) -> tuple[str, int]:
    """Resolve (mode, port): MCP_TRANSPORT/MCP_PORT env wins (bundle/CI use).

    Claude Desktop bundles and the fleet pack check launch with
    ``MCP_TRANSPORT=http MCP_PORT=<probe>``; honor them so the same entry
    point serves stdio locally and HTTP in a bundle.
    """
    mode = mode_arg
    if os.environ.get("MCP_TRANSPORT", "").lower() == "http":
        mode = "http"
    try:
        port = int(os.environ.get("MCP_PORT", str(port_arg)))
    except ValueError:
        port = port_arg
    return mode, port


def main():
    """CLI entry: stdio (default), http, or dual."""
    import argparse

    parser = argparse.ArgumentParser(description="iptv-org MCP Server")
    parser.add_argument("--mode", choices=["stdio", "http", "dual"], default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=11242)
    parser.add_argument("--serve", action="store_true", help="Alias for --mode dual")
    args = parser.parse_args()
    mode = "dual" if args.serve else args.mode
    mode, port = resolve_runtime(mode, args.port)
    if mode == "stdio":
        asyncio.run(_run_stdio())
    else:
        logging.basicConfig(level=get_settings().log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
        logger.info("Starting iptv-org MCP on %s:%s (mode=%s)", args.host, port, mode)
        uvicorn.run(app, host=args.host, port=port, log_level="info")


if __name__ == "__main__":
    main()
