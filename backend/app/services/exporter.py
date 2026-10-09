"""Export a meeting as Markdown, plain text or PDF."""
from typing import Tuple
from fpdf import FPDF
from .. import models


def _fmt(sec: float) -> str:
    return f"{int(sec // 60):02d}:{int(sec % 60):02d}"


def _latin(s: str) -> str:
    rep = {"“": '"', "”": '"', "‘": "'", "’": "'", "–": "-", "—": "-", "…": "...", "•": "-", "\u00a0": " "}
    for k, v in rep.items():
        s = s.replace(k, v)
    return s.encode("latin-1", "replace").decode("latin-1")


def _header(m: models.Meeting) -> dict:
    return {"date": m.date.strftime("%b %d, %Y %I:%M %p UTC"), "dur": f"{m.duration // 60} min",
            "who": ", ".join(p.name for p in m.participants) or "-"}


def to_markdown(m: models.Meeting) -> str:
    h = _header(m)
    o = [f"# {m.title}", "", f"**Date:** {h['date']}  ", f"**Duration:** {h['dur']}  ", f"**Participants:** {h['who']}", ""]
    o += ["## Overview", m.overview or "_No summary._", ""]
    if m.key_points:
        o += ["## Key points"] + [f"- {k.text}" for k in m.key_points] + [""]
    if m.chapters:
        o += ["## Chapters"] + [f"- `{_fmt(c.start_time)}` **{c.title}** - {c.summary}" for c in m.chapters] + [""]
    o += ["## Action items"]
    for a in m.action_items:
        who = f" (@{a.assignee.name})" if a.assignee else ""
        due = f" - due {a.due_date.isoformat()}" if a.due_date else ""
        o.append(f"- [{'x' if a.completed else ' '}] {a.text}{who}{due}")
    o += ["", "## Transcript", ""]
    for s in m.segments:
        o.append(f"**{s.speaker.name if s.speaker else 'Speaker'}** `{_fmt(s.start_time)}`  \n{s.text}\n")
    return "\n".join(o)


def to_text(m: models.Meeting) -> str:
    h = _header(m)
    o = [m.title.upper(), "=" * len(m.title), f"Date: {h['date']}", f"Duration: {h['dur']}", f"Participants: {h['who']}", "",
         "OVERVIEW", m.overview or "-", ""]
    if m.key_points:
        o += ["KEY POINTS"] + [f"  * {k.text}" for k in m.key_points] + [""]
    if m.chapters:
        o += ["CHAPTERS"] + [f"  [{_fmt(c.start_time)}] {c.title}" for c in m.chapters] + [""]
    o += ["ACTION ITEMS"]
    for a in m.action_items:
        o.append(f"  [{'x' if a.completed else ' '}] {a.text}" + (f" ({a.assignee.name})" if a.assignee else "")
                 + (f" - due {a.due_date.isoformat()}" if a.due_date else ""))
    o += ["", "TRANSCRIPT"] + [f"[{_fmt(s.start_time)}] {s.speaker.name if s.speaker else 'Speaker'}: {s.text}" for s in m.segments]
    return "\n".join(o)


def to_pdf(m: models.Meeting) -> bytes:
    h = _header(m)
    pdf = FPDF()
    pdf.set_auto_page_break(True, 15)
    pdf.add_page()
    W = pdf.w - pdf.l_margin - pdf.r_margin

    def title(t):
        pdf.set_font("Helvetica", "B", 18); pdf.set_text_color(30, 20, 60)
        pdf.multi_cell(W, 9, _latin(t), new_x="LMARGIN", new_y="NEXT")

    def h2(t):
        pdf.ln(3); pdf.set_font("Helvetica", "B", 12); pdf.set_text_color(110, 60, 230)
        pdf.cell(W, 8, _latin(t), new_x="LMARGIN", new_y="NEXT")

    def body(t, bold=False):
        pdf.set_font("Helvetica", "B" if bold else "", 10); pdf.set_text_color(40, 40, 50)
        pdf.multi_cell(W, 5.5, _latin(t), new_x="LMARGIN", new_y="NEXT")

    title(m.title)
    body(f"{h['date']}  |  {h['dur']}  |  {h['who']}")
    h2("Overview"); body(m.overview or "-")
    if m.key_points:
        h2("Key points")
        for k in m.key_points:
            body(f"- {k.text}")
    if m.chapters:
        h2("Chapters")
        for c in m.chapters:
            body(f"[{_fmt(c.start_time)}] {c.title}: {c.summary}")
    h2("Action items")
    for a in m.action_items:
        body(f"[{'x' if a.completed else ' '}] {a.text}" + (f" ({a.assignee.name})" if a.assignee else "")
             + (f" - due {a.due_date.isoformat()}" if a.due_date else ""))
    h2("Transcript")
    for s in m.segments:
        body(f"{s.speaker.name if s.speaker else 'Speaker'}  [{_fmt(s.start_time)}]", bold=True)
        body(s.text)
    return bytes(pdf.output())


def export(m: models.Meeting, fmt: str) -> Tuple[bytes, str, str]:
    # ASCII-only: HTTP headers must be latin-1, and str.isalnum() is True for e.g. Hindi letters.
    safe = "".join(c if (c.isascii() and c.isalnum()) or c in "-_" else "_" for c in m.title)[:60].strip("_") or "meeting"
    if fmt == "pdf":
        return to_pdf(m), "application/pdf", f"{safe}.pdf"
    if fmt == "md":
        return to_markdown(m).encode(), "text/markdown; charset=utf-8", f"{safe}.md"
    return to_text(m).encode(), "text/plain; charset=utf-8", f"{safe}.txt"
