"""Best-effort stream liveness probes (bounded, never proxied)."""

import asyncio
import logging

import httpx

from iptv_org_mcp.config import get_settings

logger = logging.getLogger("iptv-org-mcp")


async def _probe_one(client: httpx.AsyncClient, url: str) -> dict:
    try:
        resp = await client.head(url, follow_redirects=True)
        if resp.status_code in (405, 501):
            resp = await client.get(url, headers={"Range": "bytes=0-0"})
        ok = resp.status_code < 400
        return {"url": url, "ok": ok, "status": resp.status_code}
    except Exception as exc:  # network is hostile; report, do not raise
        return {"url": url, "ok": False, "status": None, "error": str(exc)[:120]}


async def probe_streams(urls: list[str]) -> list[dict]:
    """Probe up to settings.probe_max URLs with settings.probe_timeout.

    ## Return Format
    List of {url, ok, status} dicts in input order (truncated to probe_max).

    ## Examples
    >>> await probe_streams(["http://example.com/x.m3u8"])  # doctest: +SKIP
    """
    settings = get_settings()
    subset = urls[: max(settings.probe_max, 1)]
    timeout = httpx.Timeout(settings.probe_timeout)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        results = await asyncio.gather(*(_probe_one(client, u) for u in subset))
    return list(results)
