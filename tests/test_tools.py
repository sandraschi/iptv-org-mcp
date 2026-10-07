"""Tool-level tests with seeded store (no network)."""

import pytest

from iptv_org_mcp.services import store
from iptv_org_mcp.tools.iptv_tools import iptv


@pytest.fixture(autouse=True)
def _seed():
    store.seed("channels", [{"id": "ORF1.at", "name": "ORF 1", "country": "AT", "categories": ["general"]}])
    store.seed(
        "streams", [{"channel": "ORF1.at", "title": "ORF 1", "url": "http://example.com/orf.m3u8", "labels": []}]
    )
    store.seed("guides", [])
    store.seed("categories", [{"id": "general", "name": "General"}])
    store.seed("countries", [{"name": "Austria", "code": "AT"}])
    store.seed("feeds", [])
    store.seed("blocklist", [])
    yield


async def test_search_channels():
    res = await iptv(operation="search_channels", query="orf")
    assert res["success"] and len(res["channels"]) == 1


async def test_build_playlist_writes_file(tmp_path, monkeypatch):
    from iptv_org_mcp import config

    monkeypatch.setattr(config.get_settings(), "cache_dir", str(tmp_path))
    res = await iptv(operation="build_playlist", country="AT")
    assert res["success"] and res["stats"]["kept"] == 1
    assert res["playlist_url"].endswith(".m3u")


async def test_help_lists_operations():
    res = await iptv(operation="help")
    assert "build_playlist" in res["operations"]
