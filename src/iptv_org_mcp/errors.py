"""Error envelope helper."""

import logging

logger = logging.getLogger("iptv-org-mcp")


def _error_response(message: str, kind: str = "internal") -> dict:
    """Build a dialogic error dict (also used by REST handlers)."""
    logger.error("error [%s]: %s", kind, message)
    return {"success": False, "message": message, "error_kind": kind}
