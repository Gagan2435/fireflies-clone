# Assignment audit: line by line

Legend: ✅ done · 🟡 partly / frontend still to do · ⬜ not started · 🔜 "Coming soon" placeholder (allowed by assignment)

## Technical stack
| Requirement | Status |
|---|---|
| Frontend Next.js (TypeScript) | ✅ already (friend's code, being reworked) |
| Backend Python FastAPI | ✅ rebuilt as a modular package `backend/app` |
| Database SQLite, own schema | ✅ 15 normalised tables (see models.py docstring) |
| No real speech-to-text; seed / upload .txt/.vtt/.json / optional LLM | ✅ parser handles txt, vtt, srt, json; LLM optional via `ANTHROPIC_API_KEY` |

## Core 1: Meetings Library / Dashboard
| Line | Status |
|---|---|
| List of past meetings: title, date, duration, participants | ✅ API · ✅ UI |
| Search & filter by title, date, participant | ✅ API (`q`, `participant`, `date_range`, `date_from/to`, `tag`) · ✅ UI (title/transcript search, participant, date, tag, sort) |
| Sort by recency | ✅ API (also duration/title) |
| Navbar with profile/settings placeholders | ✅ topbar + profile menu + notifications + help (M2) |

## Core 2: Meeting / Transcript detail
| Line | Status |
|---|---|
| Interactive transcript with speaker labels + timestamps | ✅ API · ✅ UI |
| Media player area with seek bar (placeholder allowed) | ✅ seek bar, play/pause, ±10s, speed; real `<audio>` if `media_url` set, else labelled simulated |
| Click line → seek, and vice versa | ✅ tested (line, seek bar, chapters, key points) |
| Search in transcript with highlighted matches | ✅ match counter, next/prev, regex-safe |

## Core 3: AI Summary & Notes
| Line | Status |
|---|---|
| AI summary | ✅ real generator from transcript (`notes_engine`); old one was a fixed template |
| Action items extracted | ✅ with assignee + due date parsing |
| Key topics / outline / chapters | ✅ topic-segmentation chapters + key points + keywords |

## Core 4: CRUD
| Line | Status |
|---|---|
| Create (upload / paste transcript / form) | ✅ `POST /meetings`, `POST /meetings/upload` · ✅ UI (/uploads: file drop or paste) |
| Edit title, participants | ✅ `PATCH /meetings/{id}` · ✅ UI |
| Delete meeting | ✅ (cascade verified by test) |
| Add / edit / complete action items | ✅ `POST`, `PATCH`, `DELETE` · ✅ UI |
| Everything persists | ✅ SQLite, seeded on first boot |

## Core 5: Fireflies experience
Navigation, panels, modals, toasts, settings → ✅ M2–M4, using the 19-page UI PDF as the reference. AskFred page, Settings (own nav, Personal/Team, theme + recording/privacy persisted, account modals), Plan page, 404 all built in M4.

## Placeholders → must say "Coming soon"
Live bot · speech-to-text · integrations · team/sharing · real auth → ✅ M4. Voice Agents, AI Skills, Analytics, Email Assistant are Coming Soon pages; Integrations and AskFred Connectors are browsable catalogues whose every action says "coming soon"; Upgrade buttons, Leave Team, Delete Account do nothing real (Delete Account is deliberately inert).

## Bonus
| Item | Status |
|---|---|
| Comments / highlights / soundbites | ✅ API (comments + soundbites tables) · ✅ UI |
| Export PDF / Markdown / TXT | ✅ all three, tested |
| Global search across meetings | ✅ `/api/search` (titles, summaries, transcript lines) |
| Tags & filtering | ✅ |
| LLM-powered ask-a-question chat | ✅ persisted chat; local retrieval by default, Claude if key set |
| Dark mode | ✅ dark default, light and system, persisted, no flash (M2) |

## Important notes
| Item | Status |
|---|---|
| Sample data: several meetings with full transcripts, summaries, action items | ✅ 6 meetings, 81 segments, 28 action items, comments, soundbites |
| Database design (evaluated) | ✅ composite-PK link tables, FKs with ON DELETE, real DATE/UTC types, indexes |
| README: setup, stack, architecture, schema, assumptions, API | ✅ M5 (ER diagram, API table, assumptions, placeholders, deployment, testing) |
| Original work | ✅ backend rewritten from scratch |
| Deliverables: public GitHub, deployed link | 🟡 deploy files + steps done (render.yaml, Procfile, env examples); **you must push to a public repo, deploy, and paste the URLs into README** |

## Bugs found in friend's version (all fixed in backend; UI ones in progress)
1. Typing `(` or `?` in transcript search crashed the page (unescaped regex).
2. Date filter did nothing (frontend/backend value mismatch).
3. Fake content shown as real: hard-coded "Key Takeaways", invented transcript in "Quick Form", platform badge derived from meeting id.
4. Settings said "saved" but saved nothing (now: theme and recording/privacy prefs persist in the browser and are verified across reload; gated options are disabled instead of pretending).
5. Timestamps shifted time zone (naive datetimes).
6. SQLite foreign keys were off (cascades silently ignored).
7. A leftover `.db` file with a test meeting was committed (now also git-ignored: `*.db`).
8. Launchers (`run.bat`, `run.ps1`, root `package.json`, `.vscode`) pointed at files that no longer exist (`seed.py`, `main:app`): all fixed.
