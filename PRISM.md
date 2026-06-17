# Prism AI — Enterprise Document Q&A

A B2B SaaS prototype: upload PDFs/Word docs, index them in a vector store, and
ask questions that Claude answers **only** from your documents — with exact,
clickable citations.

## Architecture

```
React + Tailwind (Vercel)  ──JWT──>  FastAPI (Railway)  ──>  Supabase (Postgres + pgvector)
        │                                   │
        │                                   ├── OpenAI  text-embedding-3-small (1536-dim)  → embeddings
   Supabase Auth                            └── Anthropic claude-opus-4-8                   → grounded answers
```

> **On embeddings:** Anthropic has no embeddings API, so OpenAI does the
> embedding and Claude does the answering. `text-embedding-3-small` is natively
> 1536-dim, which matches the `vector(1536)` schema exactly.

## Repo layout

| Path | What |
| ---- | ---- |
| `src/` | React app. Marketing site (`/`, `/app`, `/roi`) **plus** the product surface below. |
| `src/pages/{Login,Signup,Dashboard,Sources,ChatApp,Settings}.tsx` | The five product pages. |
| `src/lib/supabase.ts`, `src/lib/api.ts`, `src/hooks/useAuth.tsx` | Auth + typed API client. |
| `backend/` | FastAPI service — see [`backend/README.md`](./backend/README.md). |
| `backend/schema.sql` | Supabase schema + `match_chunks` RPC + signup trigger. |

## Product routes (auth-gated)

`/login` · `/signup` · `/dashboard` · `/sources` · `/chat` · `/settings`

## Run it locally

1. **Database:** run [`backend/schema.sql`](./backend/schema.sql) in the Supabase SQL editor.
2. **Backend:** `cd backend && cp .env.example .env` (fill in), `pip install -r requirements.txt`, `uvicorn app.main:app --reload`.
3. **Frontend:** `cp .env.example .env` (fill in `VITE_*`), `npm install`, `npm run dev`.

Required secrets (already set in Railway for the backend): `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `FRONTEND_URL`. Frontend needs `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

## How a question is answered

1. The chat client embeds nothing locally — it POSTs the question to `/query` with the user's Supabase JWT.
2. The backend embeds the question (OpenAI), runs an org-scoped top-5 cosine search in pgvector (`match_chunks`).
3. Claude (`claude-opus-4-8`, structured outputs) writes a 2–3 sentence summary and selects supporting quotes, using **only** the retrieved excerpts.
4. The backend validates each returned `chunk_id` against what it actually retrieved, enriches citations with document name + location, and returns `{ summary, citations }`.
5. Clicking a citation opens the document preview panel with the exact quote highlighted in blue.
