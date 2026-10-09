from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services import ask_fred, exporter, meeting_service as svc

router = APIRouter(prefix="/api/meetings", tags=["meetings"])
MAX_UPLOAD = 5 * 1024 * 1024


def _get(db: Session, meeting_id: int) -> models.Meeting:
    m = svc.get_meeting(db, meeting_id)
    if not m:
        raise HTTPException(404, "Meeting not found")
    return m


@router.get("", response_model=List[schemas.MeetingListItem])
def list_meetings(q: Optional[str] = None, participant: Optional[str] = None, tag: Optional[str] = None,
                  date_range: Optional[str] = Query(None, pattern="^(today|week|month|quarter)$"),
                  date_from: Optional[date] = None, date_to: Optional[date] = None,
                  sort_by: str = Query("recency", pattern="^(recency|duration|title)$"),
                  order: str = Query("desc", pattern="^(asc|desc)$"), db: Session = Depends(get_db)):
    ms = svc.list_meetings(db, q, participant, tag, date_range, date_from, date_to, sort_by, order)
    return [svc.list_item(m) for m in ms]


@router.post("", response_model=schemas.MeetingDetail, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    if payload.transcript_text is not None and not payload.transcript_text.strip():
        payload.transcript_text = None
    src = "paste" if payload.transcript_text else "form"
    return svc.detail(svc.create_meeting(db, payload, source=src))


@router.post("/upload", response_model=schemas.MeetingDetail, status_code=201)
async def upload_transcript(file: UploadFile = File(...), title: Optional[str] = Form(None),
                            participants: Optional[str] = Form(None), tags: Optional[str] = Form(None),
                            db: Session = Depends(get_db)):
    """Upload a .txt / .vtt / .srt / .json transcript. Audio/video upload is a 'Coming soon' feature."""
    name = file.filename or "transcript.txt"
    if not name.lower().endswith((".txt", ".vtt", ".srt", ".json")):
        raise HTTPException(415, "Only .txt, .vtt, .srt and .json transcripts are supported right now")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD:
        raise HTTPException(413, "Transcript file is too large (max 5 MB)")
    if b"\x00" in raw[:4096]:
        raise HTTPException(422, "This looks like a binary file, not a text transcript")
    text = raw.decode("utf-8-sig", errors="replace")
    if not text.strip():
        raise HTTPException(422, "The file is empty")
    people = [schemas.ParticipantIn(name=p.strip()) for p in (participants or "").split(",") if p.strip()]
    tag_list = [t.strip().lstrip("#") for t in (tags or "").split(",") if t.strip().lstrip("#")] or ["uploaded"]
    fallback = name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip().title() or "Untitled meeting"
    payload = schemas.MeetingCreate(title=(title or "").strip() or fallback, transcript_text=text, filename=name,
                                    participants=people, tags=tag_list)
    if not svc.parse_transcript(text, name):
        raise HTTPException(422, "No transcript text could be found in this file")
    return svc.detail(svc.create_meeting(db, payload, source="upload"))


@router.get("/{meeting_id}", response_model=schemas.MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return svc.detail(_get(db, meeting_id))


@router.patch("/{meeting_id}", response_model=schemas.MeetingDetail)
@router.put("/{meeting_id}", response_model=schemas.MeetingDetail, include_in_schema=False)
def update_meeting(meeting_id: int, payload: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    return svc.detail(svc.update_meeting(db, _get(db, meeting_id), payload))


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    svc.delete_meeting(db, _get(db, meeting_id))


@router.post("/{meeting_id}/regenerate-notes", response_model=schemas.MeetingDetail)
def regenerate(meeting_id: int, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    if not m.segments:
        raise HTTPException(422, "This meeting has no transcript to summarise")
    return svc.detail(svc.regenerate_notes(db, m))


# ----- action items -----
@router.post("/{meeting_id}/action-items", response_model=schemas.ActionItemOut, status_code=201)
def add_action_item(meeting_id: int, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    return svc.action_out(svc.add_action_item(db, _get(db, meeting_id), payload))


# ----- comments / soundbites -----
@router.post("/{meeting_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(meeting_id: int, payload: schemas.CommentCreate, db: Session = Depends(get_db)):
    return svc.comment_out(svc.add_comment(db, _get(db, meeting_id), payload))


@router.post("/{meeting_id}/soundbites", response_model=schemas.SoundbiteOut, status_code=201)
def add_soundbite(meeting_id: int, payload: schemas.SoundbiteCreate, db: Session = Depends(get_db)):
    try:
        return svc.add_soundbite(db, _get(db, meeting_id), payload)
    except ValueError as e:
        raise HTTPException(422, str(e))


# ----- tags -----
@router.post("/{meeting_id}/tags", response_model=List[schemas.TagOut])
def add_tag(meeting_id: int, payload: dict, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(422, "Tag name is required")
    svc.update_meeting(db, m, schemas.MeetingUpdate(tags=[t.name for t in m.tags] + [name]))
    return svc.get_meeting(db, meeting_id).tags


# ----- Ask Fred (per meeting) -----
@router.get("/{meeting_id}/chat", response_model=List[schemas.ChatMessageOut])
def chat_history(meeting_id: int, db: Session = Depends(get_db)):
    return [_chat_out(c) for c in _get(db, meeting_id).chat_messages]


@router.post("/{meeting_id}/chat", response_model=schemas.ChatMessageOut)
def chat(meeting_id: int, payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    _get(db, meeting_id)
    return _chat_out(ask_fred.ask(db, meeting_id, payload.question))


@router.delete("/{meeting_id}/chat", status_code=204)
def clear_chat(meeting_id: int, db: Session = Depends(get_db)):
    db.query(models.ChatMessage).filter_by(meeting_id=meeting_id).delete()
    db.commit()


# ----- export -----
@router.get("/{meeting_id}/export")
def export(meeting_id: int, format: str = Query("md", pattern="^(md|txt|pdf)$"), db: Session = Depends(get_db)):
    body, mime, filename = exporter.export(_get(db, meeting_id), format)
    return Response(body, media_type=mime, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


def _chat_out(c: models.ChatMessage) -> schemas.ChatMessageOut:
    import json
    return schemas.ChatMessageOut(id=c.id, meeting_id=c.meeting_id, role=c.role, content=c.content,
                                  sources=json.loads(c.sources) if c.sources else [], created_at=c.created_at)
