"""Runtime resolution tests (bundle env overrides, no network)."""

from iptv_org_mcp.server import resolve_runtime


def test_defaults_without_env(monkeypatch) -> None:
    monkeypatch.delenv("MCP_TRANSPORT", raising=False)
    monkeypatch.delenv("MCP_PORT", raising=False)
    assert resolve_runtime("stdio", 11242) == ("stdio", 11242)
    assert resolve_runtime("dual", 11242) == ("dual", 11242)


def test_http_env_forces_http_mode(monkeypatch) -> None:
    monkeypatch.setenv("MCP_TRANSPORT", "http")
    monkeypatch.setenv("MCP_PORT", "39812")
    assert resolve_runtime("stdio", 11242) == ("http", 39812)


def test_bad_port_falls_back(monkeypatch) -> None:
    monkeypatch.delenv("MCP_TRANSPORT", raising=False)
    monkeypatch.setenv("MCP_PORT", "notaport")
    assert resolve_runtime("dual", 11242) == ("dual", 11242)
