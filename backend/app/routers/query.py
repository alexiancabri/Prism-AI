"""RAG query endpoint.

Embed the question -> pgvector similarity search (top-k chunks, org-scoped) ->
Claude answers using ONLY those excerpts -> structured JSON response.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from .. import config
from ..answering import answer_question
from ..auth import CurrentUser, User
from ..db import get_supabase
from ..embeddings import embed_query

router = APIRouter(tags=["query"])


class QueryRequest(BaseModel):
    question: str


def _retrieve(org_id: str, question: str) -> list[dict]:
    sb = get_supabase()
    query_embedding = embed_query(question)
    res = sb.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "match_org": org_id,
            "match_count": config.TOP_K,
        },
    ).execute()

    rows = res.data or []
    if not rows:
        return []

    # Pull document names for the matched chunks in one round trip.
    doc_ids = list({r["document_id"] for r in rows})
    docs = (
        sb.table("documents")
        .select("id, name")
        .in_("id", doc_ids)
        .eq("org_id", org_id)
        .execute()
    )
    name_by_id = {d["id"]: d["name"] for d in docs.data}

    return [
        {
            "id": r["id"],
            "document_id": r["document_id"],
            "document_name": name_by_id.get(r["document_id"], "Unknown document"),
            "location": r["location"],
            "content": r["content"],
        }
        for r in rows
    ]


@router.post("/query")
def query(req: QueryRequest, user: User = CurrentUser):
    chunks = _retrieve(user.org_id, req.question)
    return answer_question(req.question, chunks)
