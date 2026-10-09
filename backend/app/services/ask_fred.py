"""Ask Fred: answers questions about one meeting (or all meetings) strictly from stored data.
Uses an LLM if configured, otherwise intent detection + keyword retrieval over the transcript."""
import json
import re
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from .. import models
from . import llm, meeting_service
from .notes_engine import STOP

Answer = Tuple[str, List[str]]


def _fmt(sec: float) -> str:
    return f"{int(sec // 60):02d}:{int(sec % 60):02d}"


def _terms(q: str) -> List[str]:
    return [w for w in re.findall(r"[a-z0-9][a-z0-9\-']+", q.lower()) if w not in STOP and len(w) > 2]


def _intent(q: str) -> str:
    ql = q.lower()
    if re.search(r"action item|to-?do|task|follow[- ]?up|assigned|deliverable|next steps", ql):
        return "actions"
    if re.search(r"who (attended|was in|spoke|was there)|participants|attendees", ql):
        return "people"
    if re.search(r"summar|overview|recap|tl;?dr|what (was|is) (this|the) (meeting|call)|what happened|about", ql):
        return "summary"
    if re.search(r"topic|chapter|agenda|outline", ql):
        return "chapters"
    if re.search(r"decision|decid|agree|key point|takeaway|highlight|important", ql):
        return "keypoints"
    if re.search(r"deadline|due|when|date|timeline", ql):
        return "dates"
    return "search"


def _answer_one(m: models.Meeting, q: str) -> Answer:
    intent, ql = _intent(q), q.lower()
    # "What did <speaker> say about X?"
    for sp in m.speakers:
        first = sp.name.split()[0].lower()
        if re.search(rf"\b{re.escape(first)}\b", ql) and intent not in ("actions", "people"):
            terms = [t for t in _terms(q) if t not in sp.name.lower().split()]
            segs = [s for s in m.segments if s.speaker_id == sp.id]
            ranked = sorted(segs, key=lambda s: -sum(t in s.text.lower() for t in terms)) if terms else segs
            top = [s for s in ranked if not terms or any(t in s.text.lower() for t in terms)][:3] or segs[:2]
            if top:
                lines = "\n".join(f"- ({_fmt(s.start_time)}) “{s.text}”" for s in sorted(top, key=lambda s: s.start_time))
                return f"Here is what **{sp.name}** said:\n{lines}", [f"{m.title} @ {_fmt(s.start_time)}" for s in top]
    if intent == "actions":
        if not m.action_items:
            return f"No action items were captured for **{m.title}**.", []
        lines = []
        for a in m.action_items:
            who = f" — **{a.assignee.name}**" if a.assignee else ""
            due = f", due {a.due_date.strftime('%b %d')}" if a.due_date else ""
            lines.append(f"- [{'x' if a.completed else ' '}] {a.text}{who}{due}")
        return f"Action items from **{m.title}**:\n" + "\n".join(lines), ["Action items"]
    if intent == "people":
        names = ", ".join(f"**{p.name}**" for p in m.participants) or "no recorded participants"
        return f"Participants in **{m.title}**: {names}.", ["Participants"]
    if intent == "summary":
        kp = "\n".join(f"- {k.text}" for k in m.key_points[:4])
        return f"**{m.title}**\n\n{m.overview or 'No summary yet.'}" + (f"\n\nKey points:\n{kp}" if kp else ""), ["Overview"]
    if intent == "chapters":
        if m.chapters:
            return "Topics covered:\n" + "\n".join(f"- ({_fmt(c.start_time)}) **{c.title}** — {c.summary}" for c in m.chapters), ["Chapters"]
    if intent == "keypoints" and m.key_points:
        return "Key points:\n" + "\n".join(f"- ({_fmt(k.start_time or 0)}) {k.text}" for k in m.key_points), [f"{m.title} @ {_fmt(k.start_time or 0)}" for k in m.key_points[:3]]
    if intent == "dates":
        dated = [a for a in m.action_items if a.due_date]
        rx = re.compile(r"\b(deadline|due|freeze|launch|release|rollout|by (monday|tuesday|wednesday|thursday|friday)|january|february|march|april|may|june|july|august|september|october|november|december)\b", re.I)
        segs = [s for s in m.segments if rx.search(s.text)][:3]
        if dated or segs:
            out = [f"- {a.text} — due **{a.due_date.strftime('%b %d, %Y')}**" for a in dated]
            out += [f"- ({_fmt(s.start_time)}) “{s.text}”" for s in segs]
            return "Dates and deadlines mentioned:\n" + "\n".join(out), [f"{m.title} @ {_fmt(s.start_time)}" for s in segs]
    terms = _terms(q)
    scored = [(sum(t in s.text.lower() for t in terms), s) for s in m.segments] if terms else []
    scored = sorted([x for x in scored if x[0] > 0], key=lambda x: (-x[0], x[1].start_time))[:3]
    if scored:
        top = sorted((s for _, s in scored), key=lambda s: s.start_time)
        lines = "\n".join(f"- **{s.speaker.name if s.speaker else 'Speaker'}** ({_fmt(s.start_time)}): “{s.text}”" for s in top)
        return f"Here is what the transcript says about that:\n{lines}", [f"{m.title} @ {_fmt(s.start_time)}" for s in top]
    return ("I couldn't find that in this meeting's transcript. Try asking for a summary, the action items, "
            "or what a specific person said."), []


def _answer_all(db: Session, q: str) -> Answer:
    intent = _intent(q)
    meetings = meeting_service.list_meetings(db)
    if intent == "actions":
        open_items = [a for m in meetings for a in m.action_items if not a.completed]
        if not open_items:
            return "You have no open action items across your meetings.", []
        lines = [f"- {a.text} — *{a.meeting.title}*" + (f" (**{a.assignee.name}**)" if a.assignee else "") for a in open_items[:15]]
        return f"You have **{len(open_items)}** open action items:\n" + "\n".join(lines), ["Tasks"]
    if intent == "summary" and meetings:
        return _answer_one(meeting_service.get_meeting(db, meetings[0].id), q)
    terms = _terms(q)
    best = []
    for m in meetings:
        full = meeting_service.get_meeting(db, m.id)
        for s in full.segments:
            sc = sum(t in s.text.lower() for t in terms)
            if sc:
                best.append((sc, full, s))
    best.sort(key=lambda x: -x[0])
    if not best:
        return "I couldn't find anything about that across your meetings.", []
    top = best[:4]
    lines = "\n".join(f"- *{m.title}* ({_fmt(s.start_time)}) **{s.speaker.name if s.speaker else ''}**: “{s.text}”" for _, m, s in top)
    return f"Across your meetings:\n{lines}", [f"{m.title} @ {_fmt(s.start_time)}" for _, m, s in top]


def ask(db: Session, meeting_id: Optional[int], question: str) -> models.ChatMessage:
    m = meeting_service.get_meeting(db, meeting_id) if meeting_id else None
    db.add(models.ChatMessage(meeting_id=meeting_id, role="user", content=question))
    answer, sources = None, []
    if llm.enabled() and m:
        ctx = "\n".join(f"[{_fmt(s.start_time)}] {s.speaker.name if s.speaker else '?'}: {s.text}" for s in m.segments)[:14000]
        answer = llm.complete("You are Fred, a meeting assistant. Answer ONLY from the transcript. Cite timestamps like [mm:ss]. Be concise.",
                              f"Meeting: {m.title}\nTranscript:\n{ctx}\n\nQuestion: {question}")
        if answer:
            sources = sorted(set(re.findall(r"\[(\d{2}:\d{2})\]", answer)))
    if not answer:
        answer, sources = _answer_one(m, question) if m else _answer_all(db, question)
    msg = models.ChatMessage(meeting_id=meeting_id, role="assistant", content=answer, sources=json.dumps(sources))
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
