"""Upstream fetch for iptv-org static JSON (httpx, short timeouts)."""

import logging

import httpx

from iptv_org_mcp.config import get_settings

logger = logging.getLogger("iptv-org-mcp")

_JSON_FILES = {
    "channels",
    "feeds",
    "logos",
    "streams",
    "guides",
    "categories",
    "languages",
    "countries",
    "subdivisions",
    "cities",
    "regions",
    "timezones",
    "blocklist",
}


async def fetch_json(name: str) -> list | dict:
    """Fetch one upstream JSON snapshot by dataset name.

    ## Return Format
    Parsed JSON (usually a list of dicts).

    ## Examples
    >>> await fetch_json("categories")  # doctest: +SKIP
    [{'id': 'news', ...}]
    """
    if name not in _JSON_FILES:
        raise ValueError(f"unknown dataset '{name}'")
    settings = get_settings()
    url = f"{settings.api_base.rstrip('/')}/{name}.json"
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        logger.info("fetched %s: %s rows", name, len(data) if isinstance(data, list) else 1)
        return data
