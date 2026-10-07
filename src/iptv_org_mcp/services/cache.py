"""Disk cache for upstream snapshots (TTL-gated JSON files)."""

import json
import time
from pathlib import Path

from iptv_org_mcp.config import get_settings


def _cache_path(name: str) -> Path:
    settings = get_settings()
    d = Path(settings.cache_dir)
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{name}.json"


def save_snapshot(name: str, data: list | dict) -> Path:
    """Persist a snapshot with a fetch timestamp envelope."""
    path = _cache_path(name)
    payload = {"fetched_at": time.time(), "data": data}
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def load_snapshot(name: str) -> tuple[list | dict | None, float | None]:
    """Load a snapshot if fresh, else (None, fetched_at-or-None).

    ## Return Format
    Tuple of (data or None, fetched_at epoch or None).
    """
    from iptv_org_mcp.services.api_client import fetch_json  # noqa: F401 (doc hint)

    path = _cache_path(name)
    if not path.exists():
        return None, None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None, None
    settings = get_settings()
    ttl = settings.cache_ttl_hours * 3600
    fetched_at = payload.get("fetched_at", 0)
    if time.time() - fetched_at > ttl:
        return None, fetched_at
    return payload.get("data"), fetched_at
