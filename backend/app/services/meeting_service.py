"""All meeting-related database logic. Routers stay thin and call into this module."""
import re
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from .. import config, models, schemas
from ..database import utcnow
from . import notes_engine, llm
from .transcript_parser import Utterance, parse_transcript

DETAIL_LOAD = (
    selectinload(models.Meeting.participants), selectinload(models.Meeting.tags),
    selectinload(models.Meeting.speakers), selectinload(models.Meeting.segments).selectinload(models.TranscriptSegment.speaker),
    selectinload(models.Meeting.chapters), selectinload(models.Meeting.key_points),
    selectinload(models.Meeting.keywords),
    selectinload(models.Meeting.action_items).selectinload(models.ActionItem.assignee),
    selectinload(models.Meeting.comments).selectinload(models.Comment.author),
    selectinload(models.Meeting.soundbites),
)


# ---------- helpers ----------
def default_user(db: Session) -> models.User:
    u = db.query(models.User).first()
    if not u:
        u = models.User(name=config.DEFAULT_USER_NAME, email=config.DEFAULT_USER_EMAIL)
        db.add(u)
        db.flush()
    return u


def _participant(db: Session, name: str, email: Optional[str] = None) -> models.Participant:
    name = name.strip()
    p = db.query(models.Participant).filter(func.lower(models.Participant.name) == name.lower()).first()
    if not p:
        p = models.Participant(name=name, email=email)
        db.add(p)
        db.flush()
    elif email and not p.email:
        p.email = email
    return p


def _tags(db: Session, names: List[str]) -> List[models.Tag]:
    out = []
    for n in dict.fromkeys(t.strip().lstrip("#").lower() for t in names if t and t.strip()):
        t = db.query(models.Tag).filter_by(name=n).first()
        if not t:
            t = models.Tag(name=n)
            db.add(t)
            db.flush()
        out.append(t)
    return out


def _fmt(sec: float) -> str:
    return f"{int(sec // 60):02d}:{int(sec % 60):02d}"


# ---------- serialisation ----------
def list_item(m: models.Meeting) -> schemas.MeetingListItem:
    open_n = sum(1 for a in m.action_items if not a.completed)
    return schemas.MeetingListItem(
        id=m.id, title=m.title, date=m.date, duration=m.duration, platform=m.platform, source=m.source,
        participants=m.participants, tags=m.tags, overview=m.overview,
        open_action_items=open_n, total_action_items=len(m.action_items))


def action_out(a: models.ActionItem) -> schemas.ActionItemOut:
    return schemas.ActionItemOut(
        id=a.id, meeting_id=a.meeting_id, segment_id=a.segment_id, assignee_id=a.assignee_id,
        assignee_name=a.assignee.name if a.assignee else None, text=a.text, due_date=a.due_date,
        completed=a.completed, created_at=a.created_at)


def comment_out(c: models.Comment) -> schemas.CommentOut:
    return schemas.CommentOut(id=c.id, meeting_id=c.meeting_id, segment_id=c.segment_id,
                              author_name=c.author.name if c.author else "Unknown", text=c.text, created_at=c.created_at)


def detail(m: models.Meeting) -> schemas.MeetingDetail:
    base = list_item(m).model_dump()
    return schemas.MeetingDetail(
        **base, media_url=m.media_url, speakers=m.speakers,
        segments=[schemas.SegmentOut(id=s.id, idx=s.idx, speaker_id=s.speaker_id,
                                     speaker_name=s.speaker.name if s.speaker else None,
                                     start_time=s.start_time, end_time=s.end_time, text=s.text) for s in m.segments],
        chapters=m.chapters, key_points=m.key_points, keywords=[k.word for k in m.keywords],
        action_items=[action_out(a) for a in m.action_items],
        comments=[comment_out(c) for c in m.comments], soundbites=m.soundbites)


# ---------- reads ----------
def get_meeting(db: Session, meeting_id: int) -> Optional[models.Meeting]:
    return db.query(models.Meeting).options(*DETAIL_LOAD).filter(models.Meeting.id == meeting_id).first()



def _like(q: str) -> str:
    """LIKE pattern for a literal substring: escape % and _ so users can't inject wildcards."""
    return "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def list_meetings(db: Session, q: Optional[str] = None, participant: Optional[str] = None, tag: Optional[str] = None,
                  date_range: Optional[str] = None, date_from: Optional[date] = None, date_to: Optional[date] = None,
                  sort_by: str = "recency", order: str = "desc") -> List[models.Meeting]:
    qs = db.query(models.Meeting).options(
        selectinload(models.Meeting.participants), selectinload(models.Meeting.tags), selectinload(models.Meeting.action_items))
    if q:
        like = _like(q.strip())
        in_transcript = db.query(models.TranscriptSegment.meeting_id).filter(models.TranscriptSegment.text.ilike(like, escape="\\"))
        in_people = (db.query(models.meeting_participants.c.meeting_id).join(models.Participant)
                     .filter(models.Participant.name.ilike(like, escape="\\")))
        qs = qs.filter(or_(models.Meeting.title.ilike(like, escape="\\"), models.Meeting.overview.ilike(like, escape="\\"),
                           models.Meeting.id.in_(in_transcript), models.Meeting.id.in_(in_people)))
    if participant:
        sub = (db.query(models.meeting_participants.c.meeting_id).join(models.Participant)
               .filter(func.lower(models.Participant.name) == participant.lower()))
        qs = qs.filter(models.Meeting.id.in_(sub))
    if tag:
        sub = (db.query(models.meeting_tags.c.meeting_id).join(models.Tag).filter(models.Tag.name == tag.lower().lstrip("#")))
        qs = qs.filter(models.Meeting.id.in_(sub))
    now = utcnow()
    presets = {"today": 1, "week": 7, "month": 30, "quarter": 90}
    if date_range in presets:
        qs = qs.filter(models.Meeting.date >= now - timedelta(days=presets[date_range]))
    if date_from:
        qs = qs.filter(models.Meeting.date >= datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc))
    if date_to:
        qs = qs.filter(models.Meeting.date < datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc))
    col = {"recency": models.Meeting.date, "duration": models.Meeting.duration, "title": func.lower(models.Meeting.title)}[sort_by]
    return qs.order_by(col.asc() if order == "asc" else col.desc(), models.Meeting.id.desc()).all()


def all_tasks(db: Session) -> List[schemas.TaskOut]:
    rows = (db.query(models.ActionItem).options(selectinload(models.ActionItem.assignee), selectinload(models.ActionItem.meeting))
            .join(models.Meeting).order_by(models.ActionItem.completed, models.Meeting.date.desc()).all())
    return [schemas.TaskOut(**action_out(a).model_dump(), meeting_title=a.meeting.title, meeting_date=a.meeting.date) for a in rows]


def people_and_tags(db: Session):
    return db.query(models.Participant).order_by(models.Participant.name).all(), db.query(models.Tag).order_by(models.Tag.name).all()


# ---------- create ----------
def store_transcript(db: Session, m: models.Meeting, utts: List[Utterance]) -> None:
    speakers = {}
    for name in dict.fromkeys(u.speaker for u in utts):
        part = _participant(db, name) if not re.fullmatch(r"Speaker \d+", name) else None
        sp = models.Speaker(meeting_id=m.id, name=name, participant_id=part.id if part else None)
        db.add(sp)
        db.flush()
        speakers[name] = sp
        if part and part not in m.participants:
            m.participants.append(part)
    for i, u in enumerate(utts):
        db.add(models.TranscriptSegment(meeting_id=m.id, speaker_id=speakers[u.speaker].id, idx=i,
                                        start_time=u.start, end_time=u.end, text=u.text))
    db.flush()


def generate_and_store_notes(db: Session, m: models.Meeting, utts: List[Utterance]) -> None:
    """(Re)build chapters / key points / keywords / action items / overview from the utterances."""
    notes = notes_engine.generate_notes(utts, m.date)
    for rel in (m.chapters, m.key_points, m.keywords):
        rel.clear()
    for a in [a for a in m.action_items if a.segment_id is not None]:   # keep manual items, replace generated ones
        db.delete(a)
    db.flush()
    seg_by_idx = {s.idx: s for s in db.query(models.TranscriptSegment).filter_by(meeting_id=m.id)}
    for i, c in enumerate(notes.chapters):
        m.chapters.append(models.Chapter(idx=i, title=c.title, summary=c.summary, start_time=c.start))
    for i, k in enumerate(notes.key_points):
        m.key_points.append(models.KeyPoint(idx=i, text=k.text, start_time=k.start))
    for i, w in enumerate(notes.keywords):
        m.keywords.append(models.Keyword(word=w, rank=i))
    for a in notes.action_items:
        who = _participant(db, a.assignee) if a.assignee else None
        db.add(models.ActionItem(meeting_id=m.id, text=a.text, assignee_id=who.id if who else None, due_date=a.due_date,
                                 segment_id=seg_by_idx[a.segment_index].id if a.segment_index in seg_by_idx else None))
    m.overview = notes.overview
    if llm.enabled():                                         # optional upgrade of the overview
        text = "\n".join(f"{u.speaker}: {u.text}" for u in utts)[:12000]
        better = llm.complete("You write concise meeting summaries (3-4 sentences, no preamble).", text)
        if better:
            m.overview = better.strip()
    db.flush()


def create_meeting(db: Session, p: schemas.MeetingCreate, source: str = "form") -> models.Meeting:
    owner = default_user(db)
    utts = parse_transcript(p.transcript_text or "", p.filename) if p.transcript_text else []
    duration = p.duration or (int(utts[-1].end) if utts else 0)
    m = models.Meeting(owner_id=owner.id, title=p.title.strip(), date=p.date or utcnow(), duration=duration,
                       platform=p.platform or ("upload" if utts else None), source=source)
    db.add(m)
    db.flush()
    for pp in p.participants:
        part = _participant(db, pp.name, pp.email)
        if part not in m.participants:
            m.participants.append(part)
    m.tags = _tags(db, p.tags)
    if utts:
        store_transcript(db, m, utts)
        generate_and_store_notes(db, m, utts)
    db.commit()
    return get_meeting(db, m.id)


def regenerate_notes(db: Session, m: models.Meeting) -> models.Meeting:
    utts = [Utterance(s.speaker.name if s.speaker else "Speaker 1", s.start_time, s.end_time, s.text) for s in m.segments]
    generate_and_store_notes(db, m, utts)
    db.commit()
    return get_meeting(db, m.id)


# ---------- update / delete ----------
def update_meeting(db: Session, m: models.Meeting, u: schemas.MeetingUpdate) -> models.Meeting:
    data = u.model_dump(exclude_unset=True)
    if "title" in data and data["title"] and data["title"].strip():
        m.title = data["title"].strip()
    if "date" in data and data["date"]:
        m.date = data["date"]
    if "overview" in data:
        m.overview = data["overview"]
    if data.get("participants") is not None:
        m.participants = [_participant(db, p["name"], p.get("email")) for p in data["participants"] if p["name"].strip()]
    if data.get("tags") is not None:
        m.tags = _tags(db, data["tags"])
    db.commit()
    return get_meeting(db, m.id)


def delete_meeting(db: Session, m: models.Meeting) -> None:
    db.delete(m)
    db.commit()


# ---------- action items ----------
def add_action_item(db: Session, m: models.Meeting, p: schemas.ActionItemCreate) -> models.ActionItem:
    who = _participant(db, p.assignee_name) if p.assignee_name and p.assignee_name.strip() else None
    a = models.ActionItem(meeting_id=m.id, text=p.text.strip(), assignee_id=who.id if who else None, due_date=p.due_date)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def patch_action_item(db: Session, a: models.ActionItem, p: schemas.ActionItemPatch) -> models.ActionItem:
    d = p.model_dump(exclude_unset=True)
    if d.get("text") is not None and d["text"].strip():
        a.text = d["text"].strip()
    if "assignee_name" in d:
        n = (d["assignee_name"] or "").strip()
        a.assignee_id = _participant(db, n).id if n else None
    if "due_date" in d:
        a.due_date = d["due_date"]
    if d.get("completed") is not None:
        a.completed = d["completed"]
    db.commit()
    db.refresh(a)
    return a


# ---------- comments / soundbites ----------
def add_comment(db: Session, m: models.Meeting, p: schemas.CommentCreate) -> models.Comment:
    c = models.Comment(meeting_id=m.id, segment_id=p.segment_id, text=p.text.strip(), author_id=default_user(db).id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def add_soundbite(db: Session, m: models.Meeting, p: schemas.SoundbiteCreate) -> models.Soundbite:
    seg = db.get(models.TranscriptSegment, p.segment_id) if p.segment_id else None
    if p.segment_id and (not seg or seg.meeting_id != m.id):
        raise ValueError("segment not in this meeting")
    start = p.start_time if p.start_time is not None else (seg.start_time if seg else 0.0)
    end = p.end_time if p.end_time is not None else (seg.end_time if seg else start + 10)
    title = p.title or (seg.text[:60].rstrip() + ("…" if seg and len(seg.text) > 60 else "") if seg else f"Clip at {_fmt(start)}")
    s = models.Soundbite(meeting_id=m.id, segment_id=p.segment_id, title=title, start_time=start, end_time=end)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


# ---------- global search ----------
def _snippet(text: str, q: str, width: int = 70) -> str:
    i = text.lower().find(q.lower())
    if i < 0:
        return text[:width * 2]
    a, b = max(0, i - width), min(len(text), i + len(q) + width)
    return ("…" if a else "") + text[a:b] + ("…" if b < len(text) else "")


def global_search(db: Session, q: str, limit: int = 30) -> schemas.SearchResults:
    q = q.strip()
    if not q:
        return schemas.SearchResults(query=q, meetings=[], hits=[])
    like = _like(q)
    hits: List[schemas.SearchHit] = []
    for m in db.query(models.Meeting).filter(models.Meeting.title.ilike(like, escape="\\")).all():
        hits.append(schemas.SearchHit(meeting_id=m.id, meeting_title=m.title, meeting_date=m.date, kind="title", snippet=m.title))
    for m in db.query(models.Meeting).filter(models.Meeting.overview.ilike(like, escape="\\")).all():
        hits.append(schemas.SearchHit(meeting_id=m.id, meeting_title=m.title, meeting_date=m.date, kind="summary",
                                      snippet=_snippet(m.overview, q)))
    segs = (db.query(models.TranscriptSegment).options(selectinload(models.TranscriptSegment.meeting))
            .filter(models.TranscriptSegment.text.ilike(like, escape="\\")).order_by(models.TranscriptSegment.meeting_id, models.TranscriptSegment.idx)
            .limit(limit).all())
    for s in segs:
        hits.append(schemas.SearchHit(meeting_id=s.meeting_id, meeting_title=s.meeting.title, meeting_date=s.meeting.date, kind="transcript",
                                      snippet=_snippet(s.text, q), start_time=s.start_time, segment_id=s.id))
    ms = list_meetings(db, q=q)
    return schemas.SearchResults(query=q, meetings=[list_item(m) for m in ms], hits=hits[:limit])
