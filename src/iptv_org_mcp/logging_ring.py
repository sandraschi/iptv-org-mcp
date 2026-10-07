"""In-memory log ring for /api/logs."""

import logging
from collections import deque
from typing import Any

_RECORDS: deque[dict[str, Any]] = deque(maxlen=500)


class _RingHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        _RECORDS.append(
            {
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
        )


_HANDLER = _RingHandler()


def install_ring_handler() -> None:
    """Attach the ring handler to the root logger once."""
    root = logging.getLogger()
    if _HANDLER not in root.handlers:
        root.addHandler(_HANDLER)


def snapshot(level: str | None = None, search: str | None = None, limit: int = 100) -> list[dict]:
    """Return newest-first log records with optional filters."""
    rows = list(reversed(_RECORDS))
    if level:
        rows = [r for r in rows if r["level"] == level.upper()]
    if search:
        rows = [r for r in rows if search.lower() in r["message"].lower()]
    return rows[: max(limit, 1)]


def get_ring_handler() -> Any:
    """Compat shim exposing .snapshot() like other fleet repos."""

    class _Shim:
        @staticmethod
        def snapshot(
            source: str | None = None, level: str | None = None, search: str | None = None, limit: int = 100
        ) -> list[dict]:
            return snapshot(level=level, search=search, limit=limit)

    return _Shim()
