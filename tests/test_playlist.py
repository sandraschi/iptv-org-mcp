"""Playlist builder unit tests (no network)."""

from iptv_org_mcp.services import store
from iptv_org_mcp.services.playlist import build_m3u

CHANNELS = [
    {"id": "ORF1.at", "name": "ORF 1", "country": "AT", "categories": ["general"], "is_nsfw": False},
    {"id": "XXX.adult", "name": "Adult", "country": "AT", "categories": ["xxx"], "is_nsfw": True},
    {"id": "BBC.uk", "name": "BBC", "country": "UK", "categories": ["news"], "is_nsfw": False},
]

STREAMS = [
    {"channel": "ORF1.at", "title": "ORF 1", "url": "http://example.com/orf.m3u8", "labels": []},
    {"channel": "XXX.adult", "title": "Adult", "url": "http://example.com/adult.m3u8", "labels": []},
    {"channel": "BBC.uk", "title": "BBC", "url": "http://example.com/bbc.m3u8", "labels": ["Geo-blocked"]},
]


def setup_function(_):
    store.seed("blocklist", [{"channel": "BLOCKED.ch", "reason": "dmca"}])


def test_country_filter_and_nsfw_default():
    m3u, stats = build_m3u(STREAMS, CHANNELS, countries=["AT"])
    assert "orf.m3u8" in m3u
    assert "adult.m3u8" not in m3u
    assert stats["kept"] == 1


def test_geo_blocked_excluded_by_default():
    m3u, _ = build_m3u(STREAMS, CHANNELS)
    assert "bbc.m3u8" not in m3u


def test_blocklist_excluded():
    streams = [*STREAMS, {"channel": "BLOCKED.ch", "title": "X", "url": "http://example.com/x.m3u8"}]
    m3u, _ = build_m3u(streams, CHANNELS)
    assert "x.m3u8" not in m3u
