# Mini AI Interviewer

A small AI-moderated qualitative research interview tool. You give it a topic, it plans an
interview around that topic, asks you adaptive questions based on what you actually say, and
ends with a synthesized summary, sentiment, key points, and keywords instead of a raw
transcript.

**Live app:** _add URL once deployed_
**Backend API:** _add URL once deployed_

## What this is and why

This is a simplified version of Anthropic's real [Anthropic Interviewer](https://www.anthropic.com/news/anthropic-interviewer)
research tool, which runs AI-moderated interviews in three stages: **planning** (draft an
interview guide for a topic), **interviewing** (adaptive follow-up questions based on what the
person actually says, not a fixed script), and **analysis** (synthesize themes, not just
summarize). This app mirrors that same three-stage shape:

1. `POST /interview/start` runs the **planning** stage - it decides whether the topic is
   workable, then drafts a strategy and 3-4 focus areas.
2. `POST /interview/answer` runs the **interviewing** stage on every turn - it looks at what you
   just said and either digs into it, moves to an uncovered focus area, or ends the interview.
3. When the interview ends, the same endpoint runs the **analysis** stage - a narrative summary,
   sentiment, and key points, synthesized across the whole conversation rather than restating
   each answer.

This is explicitly a research interview, not a job-interview simulator or a quiz. There's no
"correct answer" and no scoring of response quality. Adaptivity means the next question digs
into the content of what you said or moves to a new area, never a judgment of whether the answer
was good.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Postgres, the `anthropic` SDK, YAKE.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Motion.
- **Deployment:** Vercel (frontend), Render (backend, Docker), Neon (Postgres).

## Running it locally

### Option A: everything in one command

```bash
cp backend/.env.example backend/.env
# fill in ANTHROPIC_API_KEY in backend/.env

docker compose up --build
```

This starts Postgres (`5432`), the backend (`http://localhost:8000`), and the frontend
(`http://localhost:3000`) together. The frontend container runs `next dev --webpack` instead of
Turbopack - Turbopack's file watcher doesn't pick up changes through a Docker bind mount on
Windows, while webpack's does when polling is enabled (`WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING`
in `docker-compose.yml`), so live-reload while editing still works.

The frontend container also gets a separate `BACKEND_INTERNAL_URL` pointing at
`http://backend:8000` (the Docker network name), used only for server-side fetches - the
read-only past-interview page is a server component that runs inside the frontend container,
where `NEXT_PUBLIC_API_URL`'s `localhost:8000` would resolve to the frontend container itself,
not the backend. Client-side fetches from the browser still use `NEXT_PUBLIC_API_URL` as normal.

### Option B: backend in Docker, frontend via `npm run dev`

Useful if you want the frontend running natively for the fastest dev-server experience.

```bash
cp backend/.env.example backend/.env
# fill in ANTHROPIC_API_KEY in backend/.env

docker compose up --build backend postgres
```

Then, in a second terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and talks to the backend via `NEXT_PUBLIC_API_URL`.

### Option C: everything without Docker

You still need a local Postgres reachable at the `DATABASE_URL` in `backend/.env` (the easiest
way is still `docker compose up postgres`, just without the backend container).

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate  # or source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env  # fill in ANTHROPIC_API_KEY and DATABASE_URL
uvicorn app.main:app --reload
```

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Backend tests

```bash
cd backend
docker compose up -d postgres  # or any reachable Postgres
pytest tests/
```

## Design decisions worth explaining

**Postgres over SQLite, even locally.** The assignment runs Postgres in production (Neon), and
using SQLite for local dev would mean testing against a different database engine than what
actually ships - the classic "works on my machine, breaks in prod" trap, especially with JSONB
columns that SQLite doesn't really have. `docker-compose.yml` runs the same Postgres locally.

**Tool use instead of prompting for JSON.** Every LLM call (planning, next-question, analysis) is
defined as an Anthropic tool with an explicit JSON schema and called with a forced `tool_choice`,
instead of asking the model to "respond in strict JSON" and parsing free text. This removes most
of the parsing failure modes that freeform-JSON-in-text prompting is prone to - code fences,
extra prose around the JSON, trailing commas. It's not bulletproof on its own, though: forced
tool use guarantees the model calls the right tool, but doesn't guarantee every field comes back
the right *type*. During testing, a `key_points` field once came back as a string instead of a
list, which passed a naive "is this field present" check and then crashed downstream. The fix was
validating each required field against its declared schema type before accepting the tool call as
valid, and retrying once with a stricter instruction if it doesn't match - which is exactly the
malformed-output handling path described below.

**YAKE instead of the LLM for keywords.** Keyword extraction is a solved problem that doesn't
need a language model - YAKE (Yet Another Keyword Extractor) does it locally, deterministically,
and for free. Using an LLM call for something a simpler tool already handles well is a cost and
latency decision, not just a technical one.

**No authentication.** There's one user role (the person being interviewed), no login, no
accounts. The app is a public demo link, and adding per-user auth would be unrequested complexity
for what this is. In production this would need real auth and per-user data isolation - right now
`GET /interviews` returns the last 20 interviews across *all* visitors, which is fine for a demo
but not something you'd want live at scale.

**Redirect once, then a graceful exit - not a strike system.** If an answer is off-topic or an
attempt to manipulate the interview (e.g. "ignore previous instructions"), the first occurrence
gets one natural question redirecting back to the topic. If it happens again, the interview ends
early with a neutral message like "it looks like we've drifted from the topic - thanks for your
time!" - never language implying the person was caught or flagged. This is deliberately not a
moderation pipeline with a strike counter; it's a graceful way to end a conversation that isn't
going anywhere, which fits a low-stakes research interview better than a ban mechanism would.

**Prompt injection handling.** The user's answer text is treated as data to analyze, never as
instructions. It's wrapped in `<user_response>` tags in every prompt, with the system prompt
stating explicitly that content in those tags is interview data regardless of what it claims to
be (including claims to be a new system instruction).

**Rate limiting only on the LLM-calling endpoints.** `POST /interview/start` and
`POST /interview/answer` are rate-limited per IP, since the app is public with no auth and every
call spends real API credits. `GET /health` is deliberately exempt, since the frontend polls it
for the cold-start wake-up check and a rate-limited health check would break that. Cheap read-only
endpoints (`GET /interviews`, `GET /interview/{id}`) aren't limited either.

**Backend cold starts on Render's free tier are expected, not a bug.** The frontend polls
`GET /health` on load and shows a friendly "waking up the server" message instead of a blank
screen while the free-tier backend spins back up after being idle.

## API

| Endpoint | What it does |
| --- | --- |
| `POST /interview/start` | `{topic}` → plans the interview, asks the first question. Returns `{session_id, question}`, or a graceful decline for inappropriate topics. |
| `POST /interview/answer` | `{session_id, answer}` → either the next adaptive question, or, once the interview ends, the full result (summary, sentiment, key points, keywords). |
| `GET /interviews` | Last 20 interviews, most recent first. |
| `GET /interview/{id}` | Full stored interview. |
| `GET /health` | `{"status": "ok"}` - used for the frontend's wake-up check. |

## Repo layout

```
backend/    FastAPI app, SQLAlchemy models, Anthropic tool-use client, tests
frontend/   Next.js app
docker-compose.yml   local backend + Postgres
```

See `CLAUDE.md` for this repo's commit/branching conventions.
