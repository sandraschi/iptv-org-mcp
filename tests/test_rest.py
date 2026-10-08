"""REST bridge tests (seeded store, no network)."""

from fastapi.testclient import TestClient

from iptv_org_mcp.server import app
from iptv_org_mcp.services import store


def _seed() -> None:
    store.seed(
        "channels",
        [{"id": "ORF1.at", "name": "ORF 1", "country": "AT", "categories": ["general"]}],
    )
    store.seed(
        "streams",
        [{"channel": "ORF1.at", "title": "ORF 1", "url": "http://example.com/orf.m3u8", "labels": []}],
    )
    store.seed("feeds", [])
    store.seed("guides", [])
    store.seed("blocklist", [])


def test_skills_list_serves_bundled_skill() -> None:
    client = TestClient(app, raise_server_exceptions=False)
    res = client.get("/api/skills")
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["count"] >= 1
    names = [s["name"] for s in body["data"]["skills"]]
    assert "iptv-operator" in names


def test_skill_content_roundtrip() -> None:
    client = TestClient(app, raise_server_exceptions=False)
    res = client.get("/api/skills/iptv-operator")
    assert res.status_code == 200
    assert "play_in_vlc" in res.json()["data"]["content"]


def test_skill_404_and_400() -> None:
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/api/skills/nope").status_code == 404
    assert client.get("/api/skills/../x").status_code in (400, 404)


def test_channel_detail_seeded() -> None:
    _seed()
    client = TestClient(app, raise_server_exceptions=False)
    res = client.get("/api/iptv/channel", params={"channel_id": "ORF1.at"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["channel"]["id"] == "ORF1.at"
    assert len(body["streams"]) == 1


def test_play_requires_target() -> None:
    client = TestClient(app, raise_server_exceptions=False)
    res = client.post("/api/iptv/play", json={})
    assert res.status_code == 200
    assert res.json()["success"] is False
