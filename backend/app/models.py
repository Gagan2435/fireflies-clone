"""Relational schema (SQLite).

users 1─* meetings
meetings *─* participants        (meeting_participants, composite PK)
meetings *─* tags                (meeting_tags, composite PK)
meetings 1─* speakers            speaker may link to a participant
meetings 1─* transcript_segments (ordered by idx; belongs to a speaker)
meetings 1─* chapters / key_points / keywords   (AI notes, normalised)
meetings 1─* action_items        (assignee -> participants, real DATE due_date)
transcript_segments 1─* comments / soundbites / action_items (optional link)
meetings 1─* chat_messages       (meeting_id NULL = workspace-wide Ask Fred)
"""
from sqlalchemy import (Boolean, Column, Date, Float, ForeignKey, Integer, String, Text,
                        Table, UniqueConstraint, Index)
from sqlalchemy.orm import relationship
from .database import Base, UTCDateTime, utcnow

meeting_participants = Table(
    "meeting_participants", Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("participant_id", ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True),
)

meeting_tags = Table(
    "meeting_tags", Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)


class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)


class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True)
    owner_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    date = Column(UTCDateTime, nullable=False, index=True)
    duration = Column(Integer, nullable=False, default=0)          # seconds
    platform = Column(String, nullable=True)                        # zoom | meet | teams | upload | null
    source = Column(String, nullable=False, default="manual")       # seed | upload | paste | form
    media_url = Column(String, nullable=True)                       # optional sample audio/video
    overview = Column(Text, nullable=True)                          # AI summary
    created_at = Column(UTCDateTime, default=utcnow)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User")
    participants = relationship("Participant", secondary=meeting_participants, order_by="Participant.name")
    tags = relationship("Tag", secondary=meeting_tags, order_by="Tag.name")
    speakers = relationship("Speaker", cascade="all, delete-orphan", back_populates="meeting")
    segments = relationship("TranscriptSegment", cascade="all, delete-orphan",
                            order_by="TranscriptSegment.idx", back_populates="meeting")
    chapters = relationship("Chapter", cascade="all, delete-orphan", order_by="Chapter.idx")
    key_points = relationship("KeyPoint", cascade="all, delete-orphan", order_by="KeyPoint.idx")
    keywords = relationship("Keyword", cascade="all, delete-orphan", order_by="Keyword.rank")
    action_items = relationship("ActionItem", cascade="all, delete-orphan",
                                order_by="ActionItem.id", back_populates="meeting")
    comments = relationship("Comment", cascade="all, delete-orphan", order_by="Comment.created_at")
    soundbites = relationship("Soundbite", cascade="all, delete-orphan", order_by="Soundbite.start_time")
    chat_messages = relationship("ChatMessage", cascade="all, delete-orphan", order_by="ChatMessage.id")


class Speaker(Base):
    __tablename__ = "speakers"
    __table_args__ = (UniqueConstraint("meeting_id", "name"),)
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id = Column(ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    meeting = relationship("Meeting", back_populates="speakers")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_segments_meeting_idx", "meeting_id", "idx"),)
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    speaker_id = Column(ForeignKey("speakers.id", ondelete="SET NULL"), nullable=True)
    idx = Column(Integer, nullable=False)
    start_time = Column(Float, nullable=False)   # seconds
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    meeting = relationship("Meeting", back_populates="segments")
    speaker = relationship("Speaker")


class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    idx = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    start_time = Column(Float, nullable=False)


class KeyPoint(Base):
    __tablename__ = "key_points"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    idx = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    start_time = Column(Float, nullable=True)


class Keyword(Base):
    __tablename__ = "keywords"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    word = Column(String, nullable=False)
    rank = Column(Integer, nullable=False, default=0)


class ActionItem(Base):
    __tablename__ = "action_items"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(ForeignKey("transcript_segments.id", ondelete="SET NULL"), nullable=True)
    assignee_id = Column(ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text, nullable=False)
    due_date = Column(Date, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(UTCDateTime, default=utcnow)
    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship("Participant")
    segment = relationship("TranscriptSegment")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=True)
    author_id = Column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)
    author = relationship("User")


class Soundbite(Base):
    __tablename__ = "soundbites"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(ForeignKey("transcript_segments.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True, index=True)
    role = Column(String, nullable=False)          # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)           # JSON list of "mm:ss" citations
    created_at = Column(UTCDateTime, default=utcnow)
