"""Local, deterministic 'AI notes' generator (no API key needed).

Given parsed utterances it produces: keywords, chapters (topic segmentation), key points,
action items (with assignee + due date) and an overview. `llm.py` can replace this with
a real LLM when ANTHROPIC_API_KEY is configured.
"""
import math
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import List, Optional

from .transcript_parser import Utterance

STOP = set("""a about above after again all also am an and any are as at be because been before being below between both but by
can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its
just let like me more most my no nor not now of off on once only or other our out over own really same she should so some such than that the
their them then there these they this those through to too under until up us very was we were what when where which while who whom why will with
would you your yeah okay ok yes sure thanks thank great good right well think know going get got make made need want say said see look one two
three team meeting today everyone hello welcome guys maybe actually kind lot thing things something anything also still back next last first
sounds fine cool glad happy time way take takes come comes put much many dont doesnt didnt youre thats theres weve ive ill hows whats let's""".split())
MONTHS = {"january", "february", "march", "april", "may", "june", "july", "august", "september",
          "october", "november", "december", "monday", "tuesday", "wednesday", "thursday", "friday",
          "saturday", "sunday", "week", "month", "year", "quarter"}
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MONTH_NUM = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"])}


@dataclass
class ChapterNote:
    title: str
    start: float
    summary: str


@dataclass
class KeyPointNote:
    text: str
    start: float


@dataclass
class ActionNote:
    text: str
    assignee: Optional[str]
    due_date: Optional[date]
    segment_index: int


@dataclass
class Notes:
    overview: str = ""
    keywords: List[str] = field(default_factory=list)
    chapters: List[ChapterNote] = field(default_factory=list)
    key_points: List[KeyPointNote] = field(default_factory=list)
    action_items: List[ActionNote] = field(default_factory=list)


def _words(text: str) -> List[str]:
    return [w for w in re.findall(r"[a-zA-Z][a-zA-Z\-']+", text.lower()) if w not in STOP and len(w) > 3]


def _sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def _mmss(sec: float) -> str:
    return f"{int(sec // 60):02d}:{int(sec % 60):02d}"


def _title(w: str) -> str:
    return w.upper() if w.isupper() or len(w) <= 2 else w.capitalize()


def _speaker_tokens(utts: List[Utterance]) -> set:
    toks = set()
    for u in utts:
        toks.update(re.findall(r"[a-z]+", u.speaker.lower()))
    return toks


def extract_keywords(utts: List[Utterance], n: int = 8) -> List[str]:
    skip = _speaker_tokens(utts) | MONTHS
    tf = Counter(w for u in utts for w in _words(u.text) if w not in skip)
    # bigram boost for recurring noun-ish pairs ("speech recognition")
    bi = Counter()
    for u in utts:
        ws = [w for w in re.findall(r"[a-zA-Z][a-zA-Z\-']+", u.text.lower())]
        for a, b in zip(ws, ws[1:]):
            if a not in STOP and b not in STOP and a not in skip and b not in skip and len(a) > 3 and len(b) > 3:
                bi[f"{a} {b}"] += 1
    out: List[str] = []
    for phrase, c in bi.most_common(3):
        if c >= 2:
            out.append(phrase)
    used = {w for p in out for w in p.split()}
    for w, _ in tf.most_common(n * 2):
        if w not in used and len(out) < n:
            out.append(w)
    return [" ".join(_title(x) for x in k.split()) for k in out[:n]]


def _cohesion(a: Counter, b: Counter) -> float:
    num = sum(a[k] * b[k] for k in a)
    den = math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values()))
    return num / den if den else 0.0


def _segment_topics(utts: List[Utterance], n_chapters: int) -> List[int]:
    """TextTiling-lite: return start indices of chapters."""
    n = len(utts)
    if n_chapters <= 1 or n < 6:
        return [0]
    bags = [Counter(_words(u.text)) for u in utts]
    win = 2
    scores = []
    for gap in range(2, n - 1):                       # boundary before utterance `gap`
        left, right = Counter(), Counter()
        for i in range(max(0, gap - win), gap):
            left.update(bags[i])
        for i in range(gap, min(n, gap + win)):
            right.update(bags[i])
        scores.append((_cohesion(left, right), gap))
    scores.sort()
    chosen: List[int] = []
    min_gap = max(3, n // (n_chapters + 1) // 2)
    for _, gap in scores:
        if all(abs(gap - c) >= min_gap for c in chosen):
            chosen.append(gap)
        if len(chosen) == n_chapters - 1:
            break
    return [0] + sorted(chosen)


def _chapter_title(chunk: List[Utterance], global_tf: Counter, skip: set) -> str:
    tf = Counter(w for u in chunk for w in _words(u.text) if w not in skip)
    total = sum(global_tf.values()) or 1
    scored = sorted(tf, key=lambda w: tf[w] * math.log(1 + total / (global_tf[w] or 1)), reverse=True)
    top = [_title(w) for w in scored[:2]]
    return " & ".join(top) if top else "Discussion"


def _best_sentence(chunk: List[Utterance], kw: set) -> str:
    best, score = "", -1.0
    for u in chunk:
        for s in _sentences(u.text):
            wc = len(s.split())
            if wc < 6:
                continue
            sc = sum(1 for w in _words(s) if w in kw) / (1 + abs(wc - 18) / 18)
            if sc > score:
                best, score = s, sc
    return best or (chunk[0].text if chunk else "")


_DECISION = re.compile(r"\b(decid|agree|approved?|commit|launch|ship|deadline|freeze|priorit|risk|blocker|budget|revenue|"
                       r"growth|increase|reduc|launched|roadmap|milestone|plan)\w*", re.I)


def extract_key_points(utts: List[Utterance], keywords: List[str], limit: int = 6) -> List[KeyPointNote]:
    kw = {w.lower() for k in keywords for w in k.split()}
    cands = []
    for u in utts:
        for s in _sentences(u.text):
            wc = len(s.split())
            if wc < 7 or wc > 40 or s.endswith("?"):
                continue
            sc = sum(1 for w in _words(s) if w in kw)
            sc += 2 * bool(_DECISION.search(s)) + 1.5 * bool(re.search(r"\d", s))
            if re.match(r"^(thanks|thank you|yes|sure|okay|right|great|sounds)", s, re.I):
                sc -= 3
            cands.append((sc, u.start, s))
    if not cands:
        return []
    cands.sort(key=lambda x: -x[0])
    picked: List[tuple] = []
    span = (utts[-1].end - utts[0].start) or 1
    for sc, st, s in cands:
        if sc <= 0:
            break
        if all(abs(st - p[1]) > span / (limit * 2.5) for p in picked):   # spread across the meeting
            picked.append((sc, st, s))
        if len(picked) == limit:
            break
    picked.sort(key=lambda x: x[1])
    return [KeyPointNote(text=s, start=st) for _, st, s in picked]


# ---------- action items ----------
_COMMIT = [
    re.compile(r"\b(?:I(?:'ll| will| can| am going to|'m going to| shall)|let me)\s+(?P<t>[^.!?]{8,})", re.I),
    re.compile(r"\b(?P<who>[A-Z][a-z]+)\s+(?:will|is going to|to)\s+(?P<t>[^.!?]{8,})"),
    re.compile(r"\b(?P<who>[A-Z][a-z]+),?\s+(?:can|could|would) you\s+(?P<t>[^.!?]{8,})", re.I),
    re.compile(r"\b(?:we|you|they)\s+(?:need|have|has|must|should|ought)\s+to\s+(?P<t>[^.!?]{8,})", re.I),
    re.compile(r"\b(?P<who>[A-Z][a-z]+)\s+(?:needs|need|has|have|must|should)\s+to\s+(?P<t>[^.!?]{8,})"),
    re.compile(r"\b(?:action item|todo|to-do|follow[- ]up)\s*[:\-]\s*(?P<t>[^.!?]{8,})", re.I),
]
# Short tasks ("mail you", "send it over") count only when they start with a clear action verb.
_VERBS = {"mail", "email", "send", "share", "call", "text", "update", "finish", "review", "complete", "schedule", "prepare",
          "submit", "fix", "write", "deliver", "book", "check", "ping", "forward", "follow", "draft", "set", "create", "post"}


def _too_short(task: str) -> bool:
    w = task.split()
    return len(w) < (2 if w and w[0].lower() in _VERBS else 4)


_NOT_TASK = re.compile(r"^(see|say|be|think|agree|walk|tell|explain|show us|let you|get back to you on that|get ahead|take a look at that|"
                       r"designed|us\b|that\b|it\b|this\b|them\b)", re.I)


def _parse_due(text: str, ref: date) -> tuple:
    """Return (due_date | None, text-without-the-due-phrase)."""
    low = text.lower()
    pats = [
        (r"\b(?:by|before|on|until|next|this)\s+(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", "wd"),
        (r"\b(?:by\s+|before\s+|on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b", "md"),
        (r"\b(?:by\s+)?(tomorrow)\b", "tm"),
        (r"\b(?:by\s+)?(end of (?:the )?week|eow)\b", "eow"),
        (r"\b(?:by\s+)?(next week)(?!'s)\b", "nw"),
        (r"\b(?:by\s+)?(today|tonight|end of (?:the )?day|eod)\b", "td"),
    ]
    for pat, kind in pats:
        m = re.search(pat, low)
        if not m:
            continue
        d: Optional[date] = None
        if kind == "wd":
            tgt = WEEKDAYS.index(m.group(1))
            delta = (tgt - ref.weekday()) % 7 or 7
            d = ref + timedelta(days=delta)
        elif kind == "md":
            mo, day = MONTH_NUM[m.group(1)], int(m.group(2))
            try:
                d = date(ref.year, mo, day)
                if d < ref - timedelta(days=30):
                    d = date(ref.year + 1, mo, day)
            except ValueError:
                d = None
        elif kind == "tm":
            d = ref + timedelta(days=1)
        elif kind == "eow":
            d = ref + timedelta(days=(4 - ref.weekday()) % 7)
        elif kind == "nw":
            d = ref + timedelta(days=7)
        elif kind == "td":
            d = ref
        trailing = not text[m.end():].strip(" .,;!")
        cleaned = text[:m.start()].strip(" ,;-") if trailing else text
        cleaned = re.sub(r"\s+(?:starting|beginning|by|before|on|until|in)$", "", cleaned, flags=re.I)
        return d, cleaned
    return None, text


def _clean_task(t: str) -> str:
    t = re.sub(r"\s+", " ", t).strip(" ,;:-")
    t = re.sub(r"^(also|then|just|actually|definitely|probably)\s+", "", t, flags=re.I)
    t = re.sub(r"\b(so that|because|which|and then|but)\b.*$", "", t, flags=re.I).strip(" ,;")
    t = re.sub(r"\s+(?:so|and|but|if|then)$", "", t, flags=re.I)
    return (t[:1].upper() + t[1:]) if t else t


def extract_action_items(utts: List[Utterance], meeting_date: datetime, people: List[str]) -> List[ActionNote]:
    ref = meeting_date.date()
    known = {p.split()[0].lower(): p for p in people}
    seen, out = set(), []
    for i, u in enumerate(utts):
        for s in _sentences(u.text):
            if s.endswith("?") and not re.search(r"\b(can|could|would) you\b", s, re.I):
                continue
            for pat in _COMMIT:
                m = pat.search(s)
                if not m:
                    continue
                gd = m.groupdict()
                task = gd["t"]
                who = gd.get("who")
                if who and who.lower() not in known:
                    who = None
                if _NOT_TASK.match(task) or _too_short(task):
                    continue
                if re.search(r"\b(that|this|it)\s*$", task, re.I) and len(task.split()) < 6:
                    continue
                if pat is _COMMIT[0]:
                    assignee = u.speaker if not re.fullmatch(r"Speaker \d+", u.speaker) else None
                else:
                    assignee = known.get(who.lower()) if who else None
                due, task = _parse_due(task, ref)
                task = _clean_task(task)
                if _too_short(task) or (re.search(r"\b(that|this|it)\s*$", task, re.I) and len(task.split()) < 6):
                    continue
                key = re.sub(r"\W", "", task.lower())[:40]
                if len(task) < 8 or key in seen:
                    continue
                seen.add(key)
                out.append(ActionNote(task, assignee, due, i))
                break
    return out[:10]


# ---------- overview ----------
def _overview(utts, keywords, key_points, actions, people) -> str:
    dur = max(1, round((utts[-1].end - utts[0].start) / 60))
    if len(people) > 1:
        who = ", ".join(people[:-1]) + f" and {people[-1]}" if len(people) <= 4 else f"{people[0]}, {people[1]} and {len(people) - 2} others"
    else:
        who = people[0] if people else "The team"
    topics = [k for k in keywords[:3]]
    topics_s = (", ".join(topics[:-1]) + f" and {topics[-1]}") if len(topics) > 1 else (topics[0] if topics else "several topics")
    parts = [f"{who} met for about {dur} minute{'s' if dur != 1 else ''} to discuss {topics_s}."]
    for kp in key_points[:2]:
        parts.append(kp.text if kp.text.endswith((".", "!")) else kp.text + ".")
    if actions:
        parts.append(f"{len(actions)} action item{'s were' if len(actions) != 1 else ' was'} captured.")
    return " ".join(parts)


def generate_notes(utts: List[Utterance], meeting_date: datetime) -> Notes:
    if not utts:
        return Notes()
    people = list(dict.fromkeys(u.speaker for u in utts))
    keywords = extract_keywords(utts)
    skip = _speaker_tokens(utts) | MONTHS
    global_tf = Counter(w for u in utts for w in _words(u.text) if w not in skip)
    n_ch = max(1, min(6, round(len(utts) / 6)))
    starts = _segment_topics(utts, n_ch)
    kwset = {w.lower() for k in keywords for w in k.split()}
    chapters = []
    for ci, si in enumerate(starts):
        ei = starts[ci + 1] if ci + 1 < len(starts) else len(utts)
        chunk = utts[si:ei]
        chapters.append(ChapterNote(_chapter_title(chunk, global_tf, skip), chunk[0].start, _best_sentence(chunk, kwset)))
    kps = extract_key_points(utts, keywords)
    actions = extract_action_items(utts, meeting_date, people)
    return Notes(_overview(utts, keywords, kps, actions, people), keywords, chapters, kps, actions)
