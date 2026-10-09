"""Cross-meeting endpoints: tasks, tags, people, global search, workspace Ask Fred, action-item / comment / soundbite mutations."""
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services import ask_fred, meeting_service as svc

router = APIRouter(prefix="/api", tags=["library"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/me")
def me(db: Session = Depends(get_db)):
    u = svc.default_user(db)
    db.commit()
    return {"id": u.id, "name": u.name, "email": u.email, "plan": "Free", "free_meetings_left": 3,
            "storage_used_mb": 0, "storage_total_mb": 400}


@router.get("/tasks", response_model=List[schemas.TaskOut])
def tasks(completed: Optional[bool] = None, db: Session = Depends(get_db)):
    ts = svc.all_tasks(db)
    return [t for t in ts if completed is None or t.completed == completed]


@router.get("/tags", response_model=List[schemas.TagOut])
def tags(db: Session = Depends(get_db)):
    return svc.people_and_tags(db)[1]


@router.get("/participants", response_model=List[schemas.ParticipantOut])
def participants(db: Session = Depends(get_db)):
    return svc.people_and_tags(db)[0]


@router.get("/search", response_model=schemas.SearchResults)
def search(q: str, db: Session = Depends(get_db)):
    return svc.global_search(db, q)


# ----- workspace-level Ask Fred -----
@router.get("/chat", response_model=List[schemas.ChatMessageOut])
def global_chat_history(db: Session = Depends(get_db)):
    rows = db.query(models.ChatMessage).filter(models.ChatMessage.meeting_id.is_(None)).order_by(models.ChatMessage.id).all()
    return [_out(c) for c in rows]


@router.post("/chat", response_model=schemas.ChatMessageOut)
def global_chat(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    return _out(ask_fred.ask(db, None, payload.question))


@router.delete("/chat", status_code=204)
def clear_global_chat(db: Session = Depends(get_db)):
    db.query(models.ChatMessage).filter(models.ChatMessage.meeting_id.is_(None)).delete()
    db.commit()


# ----- mutations on child resources by id -----
@router.patch("/action-items/{item_id}", response_model=schemas.ActionItemOut)
def patch_action_item(item_id: int, payload: schemas.ActionItemPatch, db: Session = Depends(get_db)):
    a = db.get(models.ActionItem, item_id)
    if not a:
        raise HTTPException(404, "Action item not found")
    return svc.action_out(svc.patch_action_item(db, a, payload))


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    a = db.get(models.ActionItem, item_id)
    if not a:
        raise HTTPException(404, "Action item not found")
    db.delete(a)
    db.commit()


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Comment, comment_id)
    if not c:
        raise HTTPException(404, "Comment not found")
    db.delete(c)
    db.commit()


@router.delete("/soundbites/{soundbite_id}", status_code=204)
def delete_soundbite(soundbite_id: int, db: Session = Depends(get_db)):
    s = db.get(models.Soundbite, soundbite_id)
    if not s:
        raise HTTPException(404, "Soundbite not found")
    db.delete(s)
    db.commit()


def _out(c: models.ChatMessage) -> schemas.ChatMessageOut:
    return schemas.ChatMessageOut(id=c.id, meeting_id=c.meeting_id, role=c.role, content=c.content,
                                  sources=json.loads(c.sources) if c.sources else [], created_at=c.created_at)
