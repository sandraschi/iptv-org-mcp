"""In-memory dataset store (snapshots loaded once per process, test-seedable)."""

from __future__ import annotations

_STORE: dict[str, list | dict] = {}
_FETCHED_AT: dict[str, float | None] = {}


def seed(name: str, data: list | dict) -> None:
    """Seed a dataset directly (tests, no network)."""
    _STORE[name] = data
    _FETCHED_AT[name] = 0.0


def set_snapshot(name: str, data: list | dict, fetched_at: float | None = None) -> None:
    """Store a fetched snapshot."""
    _STORE[name] = data
    _FETCHED_AT[name] = fetched_at


def get_snapshot(name: str) -> list | dict | None:
    """Return the stored dataset or None."""
    return _STORE.get(name)


def get_blocked_ids() -> set[str]:
    """Return channel ids from blocklist snapshot (dmca/nsfw)."""
    data = _STORE.get("blocklist") or []
    ids: set[str] = set()
    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict) and row.get("channel"):
                ids.add(row["channel"])
    return ids


def stats() -> dict:
    """Return row counts per loaded dataset."""
    out: dict[str, int] = {}
    for k, v in _STORE.items():
        out[k] = len(v) if isinstance(v, list) else 1
    return out
