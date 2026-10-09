"""Seed the database:  python -m app.seed.run [--reset]"""
import sys
from datetime import timedelta

from sqlalchemy.orm import Session

from .. import models
from ..database import Base, SessionLocal, engine, utcnow
from ..services import meeting_service as svc
from ..services.notes_engine import ChapterNote
from ..services.transcript_parser import parse_transcript
from .data import MEETINGS, PEOPLE, VTT_MEETING


def _seed_one(db: Session, d: dict, filename: str = None) -> models.Meeting:
    owner = svc.default_user(db)
    when = (utcnow() - timedelta(days=d["days_ago"])).replace(hour=d["hour"], minute=0, second=0, microsecond=0)
    utts = parse_transcript(d["transcript"], filename)
    m = models.Meeting(owner_id=owner.id, title=d["title"], date=when, duration=int(utts[-1].end) + 20,
                       platform=d["platform"], source="seed")
    db.add(m)
    db.flush()
    svc.store_transcript(db, m, utts)
    for p in m.participants:
        if p.name in PEOPLE:
            p.email = PEOPLE[p.name]
    m.tags = svc._tags(db, d["tags"])
    svc.generate_and_store_notes(db, m, utts)          # key points, keywords, action items (+ default chapters)
    if d.get("chapters"):                              # curated chapters / overview replace the generated ones
        m.chapters.clear()
        db.flush()
        for i, (t, title, summary) in enumerate(d["chapters"]):
            m.chapters.append(models.Chapter(idx=i, title=title, summary=summary, start_time=float(t)))
    if d.get("overview"):
        m.overview = d["overview"]
    db.flush()
    segs = {s.idx: s for s in m.segments}
    me = svc.default_user(db)
    for idx, text in d.get("comments", []):
        db.add(models.Comment(meeting_id=m.id, segment_id=segs[idx].id, author_id=me.id, text=text))
    for idx, title in d.get("soundbites", []):
        s = segs[idx]
        db.add(models.Soundbite(meeting_id=m.id, segment_id=s.id, title=title, start_time=s.start_time, end_time=s.end_time))
    db.flush()
    db.expire(m, ["action_items"])
    for i in d.get("done_actions", []):
        if i < len(m.action_items):
            m.action_items[i].completed = True
    return m


def seed(db: Session) -> int:
    for d in MEETINGS:
        _seed_one(db, d)
    _seed_one(db, VTT_MEETING, filename="support_retro.vtt")
    db.commit()
    return db.query(models.Meeting).count()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(models.Meeting).count():
            print("Database already has meetings; use --reset to reseed.")
        else:
            print(f"Seeded {seed(db)} meetings")
    finally:
        db.close()
