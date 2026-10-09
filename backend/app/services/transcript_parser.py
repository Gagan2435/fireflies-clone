"""Turn an uploaded / pasted transcript (.txt, .vtt, .srt, .json) into utterances."""
import json
import re
from dataclasses import dataclass
from typing import List, Optional

WORDS_PER_SEC = 2.6  # used to estimate timing when a transcript has none


@dataclass
class Utterance:
    speaker: str
    start: float
    end: float
    text: str


def _ts(s) -> Optional[float]:
    """'1:05', '01:02:03', '00:00:01.500', '00:00:01,500', 12, '12.5' -> seconds."""
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return float(s)
    s = str(s).strip().replace(",", ".")
    if re.fullmatch(r"\d+(\.\d+)?", s):
        return float(s)
    parts = s.split(":")
    if not 2 <= len(parts) <= 3:
        return None
    try:
        nums = [float(p) for p in parts]
    except ValueError:
        return None
    sec = 0.0
    for n in nums:
        sec = sec * 60 + n
    return sec


_TS = r"\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?"
# [00:15] Name: text | 00:15 Name: text | Name (00:15): text | 00:15 text | Name: text
_LINE_PATTERNS = [
    re.compile(rf"^\[?(?P<t>{_TS})\]?\s*[-–]?\s*(?P<s>[^:\n]{{1,40}}?):\s*(?P<x>.+)$"),
    re.compile(rf"^(?P<s>[^:\n\[\(]{{1,40}}?)\s*[\[\(](?P<t>{_TS})[\]\)]\s*:?\s*(?P<x>.+)$"),
    re.compile(rf"^\[?(?P<t>{_TS})\]?\s+(?P<x>.+)$"),
    re.compile(r"^(?P<s>[A-Z][\w .'-]{0,38}?):\s+(?P<x>.+)$"),
]


# "Gagan - hello there" / "Gagan – hello" / "Gagan — hello". Only used when most lines look like this,
# so an ordinary sentence containing a dash is not mistaken for a speaker label.
_DASH_LINE = re.compile(r"^(?P<s>[A-Z][\w.'-]*(?: [A-Z][\w.'-]*){0,2})\s+[-–—]\s+(?P<x>\S.*)$")


def _finish(raw: List[dict]) -> List[Utterance]:
    """Fill in missing starts/ends and clean the text."""
    out: List[Utterance] = []
    cursor = 0.0
    for i, r in enumerate(raw):
        text = re.sub(r"\s+", " ", r["text"]).strip()
        if not text:
            continue
        start = r.get("start")
        if start is None:
            start = cursor
        est = max(2.0, len(text.split()) / WORDS_PER_SEC)
        end = r.get("end")
        if end is None or end <= start:
            nxt = next((x.get("start") for x in raw[i + 1:] if x.get("start") is not None), None)
            end = min(start + est, nxt) if nxt and nxt > start else start + est
        out.append(Utterance(r.get("speaker") or "Speaker 1", round(start, 2), round(end, 2), text))
        cursor = end + 0.8
    return out


def _parse_cues(raw: str) -> List[Utterance]:
    """WebVTT / SRT."""
    cue = re.compile(rf"({_TS})\s*-->\s*({_TS})")
    items = []
    for b in re.split(r"\n\s*\n", raw.replace("\r\n", "\n")):
        lines = [l for l in b.split("\n") if l.strip()]
        for i, l in enumerate(lines):
            m = cue.search(l)
            if not m:
                continue
            body = " ".join(lines[i + 1:])
            speaker = None
            v = re.match(r"<v\s+([^>]+)>(.*?)(?:</v>)?$", body)
            if v:
                speaker, body = v.group(1).strip(), v.group(2)
            else:
                s = re.match(r"^([A-Z][\w .'-]{0,38}?):\s+(.*)$", body)
                if s:
                    speaker, body = s.group(1), s.group(2)
            body = re.sub(r"<[^>]+>", "", body)
            items.append({"speaker": speaker, "start": _ts(m.group(1)), "end": _ts(m.group(2)), "text": body})
            break
    return _finish(items)


def _parse_json(raw: str) -> Optional[List[Utterance]]:
    try:
        data = json.loads(raw)
    except ValueError:
        return None
    if isinstance(data, dict):
        for k in ("segments", "transcript", "utterances", "sentences", "items"):
            if isinstance(data.get(k), list):
                data = data[k]
                break
    if not isinstance(data, list):
        return None
    items = []
    for d in data:
        if isinstance(d, str):
            items.append({"text": d})
        elif isinstance(d, dict):
            items.append({
                "speaker": d.get("speaker") or d.get("speaker_name") or d.get("name"),
                "start": _ts(d.get("start", d.get("start_time", d.get("timestamp")))),
                "end": _ts(d.get("end", d.get("end_time"))),
                "text": str(d.get("text") or d.get("sentence") or d.get("content") or ""),
            })
    return _finish(items)


def _parse_plain(raw: str) -> List[Utterance]:
    items: List[dict] = []
    lines = [l.strip() for l in raw.replace("\r\n", "\n").split("\n") if l.strip()]
    dash_hits = sum(1 for l in lines if _DASH_LINE.match(l) and not any(p.match(l) for p in _LINE_PATTERNS))
    patterns = _LINE_PATTERNS + ([_DASH_LINE] if dash_hits >= 2 and dash_hits * 2 >= len(lines) else [])
    structured = any(pat.match(l) for l in lines for pat in patterns)
    for line in lines:
        for pat in patterns:
            m = pat.match(line)
            if m:
                g = m.groupdict()
                items.append({"speaker": (g.get("s") or "").strip() or None,
                              "start": _ts(g.get("t")), "text": g["x"]})
                break
        else:
            if items and structured:                    # wrapped continuation of previous line
                items[-1]["text"] += " " + line
            else:
                items.append({"text": line})
    return _finish(items)


def parse_transcript(raw: str, filename: Optional[str] = None) -> List[Utterance]:
    raw = (raw or "").lstrip("\ufeff").strip()
    if not raw:
        return []
    name = (filename or "").lower()
    if name.endswith(".json") or raw[:1] in "[{":
        r = _parse_json(raw)
        if r is not None:
            return r
    if name.endswith((".vtt", ".srt")) or "-->" in raw[:400]:
        r = _parse_cues(raw)
        if r:
            return r
    return _parse_plain(raw)
