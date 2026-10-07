"""Unified gateway: FastAPI REST + FastMCP streamable HTTP on one port."""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from iptv_org_mcp import tools  # noqa: F401  (tool registration side-effect)
from iptv_org_mcp._mcp import mcp
from iptv_org_mcp.config import get_settings
from iptv_org_mcp.errors import _error_response
from iptv_org_mcp.logging_ring import get_ring_handler, install_ring_handler

logger = logging.getLogger("iptv-org-mcp")
_START_TIME = time.time()
_MCP_PATH = "/mcp"
_mcp_http = mcp.http_app(path=_MCP_PATH)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: install log ring, report config (no network on boot)."""
    install_ring_handler()
    settings = get_settings()
    logger.info("iptv-org MCP startup - backend=%s api=%s", settings.port, settings.api_base)
    async with _mcp_http.lifespan(app):
        yield


app = FastAPI(lifespan=lifespan, title="iptv-org MCP", version="0.1.0")
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
        "version": "0.1.0",
        "uptime_seconds": int(time.time() - _START_TIME),
        "tool_count": len(await mcp.list_tools()),
    }


@app.get("/api/tools")
async def api_tools():
    """Dynamic MCP tool list (never hardcoded)."""
    tool_list = await mcp.list_tools()
    return {
        "success": True,
        "data": {
            "tools": [{"name": t.name, "description": t.description} for t in tool_list],
            "count": len(tool_list),
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
        "version": "0.1.0",
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


@app.get("/favicon.ico", include_in_schema=False)
async def api_favicon():
    """Silence browser favicon noise with a 204."""
    from fastapi import Response

    return Response(status_code=204)


app.mount("/", _mcp_http)


async def _run_stdio():
    await mcp.run_stdio_async()


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
    if mode == "stdio":
        asyncio.run(_run_stdio())
    else:
        logging.basicConfig(level=get_settings().log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
        logger.info("Starting iptv-org MCP on %s:%s (mode=%s)", args.host, args.port, mode)
        uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
