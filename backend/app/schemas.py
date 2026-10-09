"""Pydantic request/response models (the API contract)."""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ParticipantIn(BaseModel):
    name: str = Field(min_length=1)
    email: Optional[str] = None


class ParticipantOut(ORM):
    id: int
    name: str
    email: Optional[str] = None


class TagOut(ORM):
    id: int
    name: str


class SpeakerOut(ORM):
    id: int
    name: str


class SegmentOut(ORM):
    id: int
    idx: int
    speaker_id: Optional[int] = None
    speaker_name: Optional[str] = None
    start_time: float
    end_time: float
    text: str


class ChapterOut(ORM):
    id: int
    title: str
    summary: Optional[str] = None
    start_time: float


class KeyPointOut(ORM):
    id: int
    text: str
    start_time: Optional[float] = None


class ActionItemOut(ORM):
    id: int
    meeting_id: int
    segment_id: Optional[int] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    text: str
    due_date: Optional[date] = None
    completed: bool
    created_at: datetime


def _not_blank(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if not v:
        raise ValueError("must not be blank")
    return v


class ActionItemCreate(BaseModel):
    text: str = Field(min_length=1)
    assignee_name: Optional[str] = None
    due_date: Optional[date] = None

    _v = field_validator("text")(_not_blank)


class ActionItemPatch(BaseModel):
    """PATCH semantics: only fields that are sent are changed (so `assignee_name: null` clears it)."""
    text: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[date] = None
    completed: Optional[bool] = None

    _v = field_validator("text")(_not_blank)


class TaskOut(ActionItemOut):
    meeting_title: str
    meeting_date: datetime


class CommentOut(ORM):
    id: int
    meeting_id: int
    segment_id: Optional[int] = None
    author_name: str
    text: str
    created_at: datetime


class CommentCreate(BaseModel):
    text: str = Field(min_length=1)
    segment_id: Optional[int] = None


class SoundbiteOut(ORM):
    id: int
    meeting_id: int
    segment_id: Optional[int] = None
    title: str
    start_time: float
    end_time: float
    created_at: datetime


class SoundbiteCreate(BaseModel):
    segment_id: Optional[int] = None
    title: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None


class MeetingListItem(ORM):
    id: int
    title: str
    date: datetime
    duration: int
    platform: Optional[str] = None
    source: str
    participants: List[ParticipantOut] = []
    tags: List[TagOut] = []
    overview: Optional[str] = None
    open_action_items: int = 0
    total_action_items: int = 0


class MeetingDetail(MeetingListItem):
    media_url: Optional[str] = None
    speakers: List[SpeakerOut] = []
    segments: List[SegmentOut] = []
    chapters: List[ChapterOut] = []
    key_points: List[KeyPointOut] = []
    keywords: List[str] = []
    action_items: List[ActionItemOut] = []
    comments: List[CommentOut] = []
    soundbites: List[SoundbiteOut] = []


class MeetingCreate(BaseModel):
    """Create from a form (title + participants) and/or pasted transcript text."""
    title: str = Field(min_length=1)
    date: Optional[datetime] = None
    duration: Optional[int] = None
    platform: Optional[str] = None
    participants: List[ParticipantIn] = []
    tags: List[str] = []
    transcript_text: Optional[str] = None
    filename: Optional[str] = None

    _v = field_validator("title")(_not_blank)


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    participants: Optional[List[ParticipantIn]] = None
    tags: Optional[List[str]] = None
    overview: Optional[str] = None

    _v = field_validator("title")(_not_blank)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)

    _v = field_validator("question")(_not_blank)


class ChatMessageOut(ORM):
    id: int
    meeting_id: Optional[int] = None
    role: str
    content: str
    sources: List[str] = []
    created_at: datetime


class SearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    meeting_date: datetime
    kind: str                      # title | transcript | summary
    snippet: str
    start_time: Optional[float] = None
    segment_id: Optional[int] = None


class SearchResults(BaseModel):
    query: str
    meetings: List[MeetingListItem]
    hits: List[SearchHit]
