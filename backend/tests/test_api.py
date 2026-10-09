"""End-to-end API tests on an isolated temp database:  pytest -q"""
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.transcript_parser import parse_transcript
from app.services.notes_engine import generate_notes
from datetime import datetime


@pytest.fixture(scope="module")
def c():
    with TestClient(app) as client:          # lifespan seeds the DB
        yield client


def test_seeded_library(c):
    ms = c.get("/api/meetings").json()
    assert len(ms) >= 6
    assert all(m["participants"] and m["duration"] > 0 for m in ms)
    dates = [m["date"] for m in ms]
    assert dates == sorted(dates, reverse=True)           # recency sort


def test_search_filter_sort(c):
    assert any("Northwind" in m["title"] for m in c.get("/api/meetings", params={"q": "Northwind"}).json())
    assert c.get("/api/meetings", params={"q": "(?["}).status_code == 200     # regex chars are safe
    assert all(any(p["name"] == "Maya Chen" for p in m["participants"]) for m in c.get("/api/meetings", params={"participant": "Maya Chen"}).json())
    assert len(c.get("/api/meetings", params={"date_range": "week"}).json()) < len(c.get("/api/meetings").json())
    by_title = [m["title"].lower() for m in c.get("/api/meetings", params={"sort_by": "title", "order": "asc"}).json()]
    assert by_title == sorted(by_title)
    assert c.get("/api/meetings", params={"tag": "sales"}).json()


def test_detail_has_everything(c):
    m = c.get("/api/meetings/1").json()
    assert m["segments"] and m["chapters"] and m["key_points"] and m["action_items"] and m["overview"] and m["keywords"]
    assert m["segments"][0]["speaker_name"]


def test_create_from_pasted_transcript_and_crud(c):
    txt = ("[00:00] Ana: Welcome to the kickoff. We will launch the beta in November.\n"
           "[00:30] Raj: I will prepare the onboarding guide by Friday.\n"
           "[01:10] Ana: Can you also book the demo room, Raj? Thanks everyone.")
    r = c.post("/api/meetings", json={"title": "Kickoff", "transcript_text": txt, "participants": [{"name": "Ana"}], "tags": ["Launch"]})
    assert r.status_code == 201
    m = r.json()
    assert {p["name"] for p in m["participants"]} >= {"Ana", "Raj"}
    assert any(a["assignee_name"] == "Raj" for a in m["action_items"])
    mid = m["id"]
    # edit metadata
    u = c.patch(f"/api/meetings/{mid}", json={"title": "Kickoff v2", "participants": [{"name": "Ana"}, {"name": "Zed"}]}).json()
    assert u["title"] == "Kickoff v2" and {p["name"] for p in u["participants"]} == {"Ana", "Zed"}
    # action items: add / edit / complete / delete
    a = c.post(f"/api/meetings/{mid}/action-items", json={"text": "Send recap", "assignee_name": "Ana", "due_date": "2026-12-01"}).json()
    assert a["assignee_name"] == "Ana" and a["due_date"] == "2026-12-01"
    p = c.patch(f"/api/action-items/{a['id']}", json={"completed": True, "text": "Send recap email"}).json()
    assert p["completed"] and p["text"] == "Send recap email" and p["assignee_name"] == "Ana"   # PATCH keeps other fields
    assert c.patch(f"/api/action-items/{a['id']}", json={"assignee_name": None}).json()["assignee_name"] is None
    assert c.delete(f"/api/action-items/{a['id']}").status_code == 204
    # persistence + delete
    assert c.get(f"/api/meetings/{mid}").json()["title"] == "Kickoff v2"
    assert c.delete(f"/api/meetings/{mid}").status_code == 204
    assert c.get(f"/api/meetings/{mid}").status_code == 404
    assert c.get("/api/tasks").status_code == 200


def test_upload_formats(c):
    vtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\n<v Kim>Hello team, let us start.</v>\n"
    r = c.post("/api/meetings/upload", files={"file": ("sync.vtt", vtt, "text/vtt")})
    assert r.status_code == 201 and r.json()["segments"][0]["speaker_name"] == "Kim"
    assert c.post("/api/meetings/upload", files={"file": ("a.pdf", b"x")}).status_code == 415
    assert c.post("/api/meetings/upload", files={"file": ("a.txt", b"  ")}).status_code == 422


def test_comments_soundbites_chat_search_export(c):
    seg = c.get("/api/meetings/1").json()["segments"][2]
    cm = c.post("/api/meetings/1/comments", json={"text": "Nice", "segment_id": seg["id"]})
    assert cm.status_code == 201 and cm.json()["author_name"]
    sb = c.post("/api/meetings/1/soundbites", json={"segment_id": seg["id"]}).json()
    assert sb["start_time"] == seg["start_time"]
    assert c.delete(f"/api/soundbites/{sb['id']}").status_code == 204
    ans = c.post("/api/meetings/1/chat", json={"question": "What are the action items?"}).json()
    assert "Action items" in ans["content"]
    assert len(c.get("/api/meetings/1/chat").json()) >= 2                 # chat persisted
    assert c.post("/api/chat", json={"question": "latency"}).json()["sources"]
    s = c.get("/api/search", params={"q": "latency"}).json()
    assert s["hits"] and s["meetings"]
    for fmt, mime in (("md", "markdown"), ("txt", "text/plain"), ("pdf", "application/pdf")):
        r = c.get("/api/meetings/1/export", params={"format": fmt})
        assert r.status_code == 200 and mime in r.headers["content-type"] and len(r.content) > 500
    assert c.get("/api/meetings/1/export").content.startswith(b"# ")
    assert c.get("/api/meetings/1/export", params={"format": "pdf"}).content[:4] == b"%PDF"


def test_cascade_delete_cleans_children(c):
    from app.database import SessionLocal
    from app import models
    r = c.post("/api/meetings", json={"title": "Temp", "transcript_text": "A: I will ship the release notes by Friday please."}).json()
    c.post(f"/api/meetings/{r['id']}/comments", json={"text": "x"})
    c.delete(f"/api/meetings/{r['id']}")
    db = SessionLocal()
    for model in (models.TranscriptSegment, models.ActionItem, models.Comment, models.Chapter, models.Speaker):
        assert db.query(model).filter_by(meeting_id=r["id"]).count() == 0
    db.close()


def test_validation(c):
    assert c.post("/api/meetings", json={"title": ""}).status_code == 422
    assert c.get("/api/meetings/99999").status_code == 404
    assert c.patch("/api/action-items/99999", json={"completed": True}).status_code == 404


def test_notes_engine_empty_and_dates():
    assert generate_notes([], datetime(2026, 1, 1)).overview == ""
    u = parse_transcript("A: I will send the budget by Friday please.\nB: Thanks a lot.")
    n = generate_notes(u, datetime(2026, 10, 7))             # Wednesday
    assert n.action_items and n.action_items[0].due_date.isoformat() == "2026-10-09"


def test_unicode_title_export_and_literal_search(c):
    """Regression: a Hindi/emoji title used to 500 on export (non-latin-1 filename in the header);
    and '%' / '_' in a search must be matched literally, not as SQL wildcards."""
    r = c.post("/api/meetings", json={"title": "हिंदी मीटिंग 🚀", "transcript_text": "राहुल: नमस्ते सब लोग।"})
    assert r.status_code == 201
    mid = r.json()["id"]
    for fmt in ("md", "txt", "pdf"):
        e = c.get(f"/api/meetings/{mid}/export", params={"format": fmt})
        assert e.status_code == 200, fmt
        e.headers["content-disposition"].encode("latin-1")      # must be header-safe
    assert c.get("/api/meetings", params={"q": "%_"}).json() == []
    assert c.delete(f"/api/meetings/{mid}").status_code == 204


# ---- edge cases (upload / validation) ----
def _up(c, name, data, **form):
    import io
    return c.post("/api/meetings/upload", files={"file": (name, io.BytesIO(data))}, data=form)


def test_upload_keeps_user_tags(c):
    r = _up(c, "sync.txt", b"Alex: hello team\nMaya: hi Alex", tags="Product, #roadmap")
    assert r.status_code == 201
    assert sorted(t["name"] for t in r.json()["tags"]) == ["product", "roadmap"]


def test_upload_default_tag_and_blank_title_fallback(c):
    r = _up(c, "weekly_sync.txt", b"Alex: hi there", title="   ")
    assert r.status_code == 201
    assert r.json()["title"] == "Weekly Sync"
    assert [t["name"] for t in r.json()["tags"]] == ["uploaded"]


def test_upload_rejects_bad_files(c):
    assert _up(c, "e.txt", b"  \n ").status_code == 422
    assert _up(c, "b.txt", bytes(range(256))).status_code == 422
    assert _up(c, "x.pdf", b"hi").status_code == 415


def test_blank_values_rejected(c):
    assert c.post("/api/meetings", json={"title": "  "}).status_code == 422
    assert c.patch("/api/meetings/1", json={"title": "  "}).status_code == 422
    assert c.post("/api/meetings/1/action-items", json={"text": "  "}).status_code == 422
    assert c.patch("/api/action-items/1", json={"text": " "}).status_code == 422


def test_dash_speakers_and_obligation_action_items(c):
    t = (b"Gagan - welcome everyone , we need to give the prototype to the client today till 6pm.\n"
         b"Vasu - yes i have almost completed it . I will mail you")
    m = _up(c, "Demo.txt", t, title="Demo").json()
    assert [s["speaker_name"] for s in m["segments"]] == ["Gagan", "Vasu"]
    texts = [a["text"].lower() for a in m["action_items"]]
    assert any("prototype" in x for x in texts) and any(x.startswith("mail") for x in texts)
    # an ordinary sentence containing a dash is not turned into a speaker
    r = c.post("/api/meetings", json={"title": "x", "transcript_text": "Well - I think so.\nWe will see tomorrow."}).json()
    assert {s["speaker_name"] for s in r["segments"]} == {"Speaker 1"}
