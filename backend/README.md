# Prism AI — Backend (FastAPI)

Enterprise document Q&A API: upload PDFs/Word docs, embed + index them in
Supabase pgvector, and answer questions with Claude using **only** the
content of the uploaded documents.

## Stack

- **FastAPI** — HTTP API
- **Supabase (Postgres + pgvector)** — auth, storage, vector search
- **OpenAI** `text-embedding-3-small` (1536-dim) — embeddings
- **Anthropic Claude** (`claude-opus-4-8`) — grounded answering with citations

> Anthropic has no embeddings endpoint, so OpenAI does the embedding and Claude
> does the answering. `text-embedding-3-small` is natively 1536-dim, matching
> the `vector(1536)` schema exactly.

## Setup

1. **Create the schema.** In the Supabase SQL editor, run [`schema.sql`](./schema.sql).
   It creates the tables, the pgvector index, the `match_chunks` similarity
   function, and a trigger that provisions an org + profile on signup.

2. **Configure env.** Copy `.env.example` → `.env` and fill it in (these are the
   vars already set in Railway). Required: `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
   `FRONTEND_URL`.

3. **Install + run.**
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --reload        # http://localhost:8000
   ```
   Railway uses the `Procfile`.

## Auth

The frontend authenticates with Supabase email/password and sends the access
token as `Authorization: Bearer <jwt>`. The backend validates it by asking
Supabase who it belongs to (`auth.get_user(token)`) — which works with both
legacy HS256 secrets and the newer asymmetric signing keys — then resolves the
caller's `org_id` via `profiles` and scopes every query to that org. It uses the
**service-role** key, so RLS is bypassed and org isolation is enforced in
application code.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/documents/upload` | Upload PDF/DOCX; chunk + embed in the background |
| `GET`  | `/documents` | List the org's documents |
| `GET`  | `/documents/{id}` | Document + its chunks (for the highlighted preview) |
| `DELETE` | `/documents/{id}` | Delete a document and its chunks |
| `POST` | `/query` | Embed question → top-5 vector search → Claude answer `{ summary, citations }` |
| `POST` | `/conversations` | Create a conversation |
| `GET`  | `/conversations` | List conversations |
| `GET`  | `/conversations/{id}/messages` | List messages |
| `POST` | `/conversations/{id}/messages` | Append a message (role/content/citations) |
| `GET`  | `/stats` | Dashboard counts + recent queries |
| `GET`  | `/health` | Liveness check |

### `/query` response shape

```json
{
  "summary": "Two to three sentence answer grounded in the documents.",
  "citations": [
    {
      "text": "exact quoted text from the document",
      "document_name": "Q4-report.pdf",
      "document_id": "uuid",
      "chunk_id": "uuid",
      "location": "p. 3"
    }
  ]
}
```

Claude is instructed to answer **only** from the supplied excerpts and to quote
verbatim; the backend validates each returned `chunk_id` against the chunks it
actually retrieved before returning citations.
