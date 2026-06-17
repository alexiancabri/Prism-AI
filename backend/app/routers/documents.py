"""Document upload, listing, retrieval, and deletion.

Upload accepts a PDF/DOCX, records the document as `indexing`, and returns
immediately. A background task extracts + chunks + embeds the file and flips
the status to `ready` (or `failed`). The UI polls `GET /documents` to watch the
transition.
"""
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from ..auth import CurrentUser, User
from ..chunking import chunk_document
from ..db import get_supabase
from ..embeddings import embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXT = (".pdf", ".docx")


def _index_document(document_id: str, org_id: str, filename: str, data: bytes) -> None:
    sb = get_supabase()
    try:
        chunks = chunk_document(filename, data)
        if not chunks:
            raise ValueError("No extractable text found in the document.")

        embeddings = embed_texts([content for content, _ in chunks])
        rows = [
            {
                "document_id": document_id,
                "org_id": org_id,
                "content": content,
                "location": location,
                "embedding": embedding,
            }
            for (content, location), embedding in zip(chunks, embeddings)
        ]
        # Insert in batches to stay well under request-size limits.
        for i in range(0, len(rows), 100):
            sb.table("chunks").insert(rows[i : i + 100]).execute()

        sb.table("documents").update({"status": "ready"}).eq(
            "id", document_id
        ).execute()
    except Exception:  # noqa: BLE001 — mark failed, surface in UI
        sb.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).execute()


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = CurrentUser,
):
    filename = file.filename or "document"
    if not filename.lower().endswith(ALLOWED_EXT):
        raise HTTPException(400, "Only .pdf and .docx files are supported.")

    data = await file.read()
    sb = get_supabase()
    doc = (
        sb.table("documents")
        .insert(
            {
                "org_id": user.org_id,
                "name": filename,
                "size": len(data),
                "status": "indexing",
            }
        )
        .execute()
    )
    document = doc.data[0]

    background_tasks.add_task(
        _index_document, document["id"], user.org_id, filename, data
    )
    return document


@router.get("")
def list_documents(user: User = CurrentUser):
    sb = get_supabase()
    res = (
        sb.table("documents")
        .select("id, name, size, status, created_at")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.get("/{document_id}")
def get_document(document_id: str, user: User = CurrentUser):
    """Document metadata + its chunks (for the highlighted preview panel)."""
    sb = get_supabase()
    doc = (
        sb.table("documents")
        .select("id, name, size, status, created_at")
        .eq("id", document_id)
        .eq("org_id", user.org_id)
        .execute()
    )
    if not doc.data:
        raise HTTPException(404, "Document not found.")

    chunks = (
        sb.table("chunks")
        .select("id, content, location, created_at")
        .eq("document_id", document_id)
        .eq("org_id", user.org_id)
        .order("created_at")
        .execute()
    )
    return {**doc.data[0], "chunks": chunks.data}


@router.delete("/{document_id}")
def delete_document(document_id: str, user: User = CurrentUser):
    sb = get_supabase()
    owned = (
        sb.table("documents")
        .select("id")
        .eq("id", document_id)
        .eq("org_id", user.org_id)
        .execute()
    )
    if not owned.data:
        raise HTTPException(404, "Document not found.")

    sb.table("chunks").delete().eq("document_id", document_id).eq(
        "org_id", user.org_id
    ).execute()
    sb.table("documents").delete().eq("id", document_id).eq(
        "org_id", user.org_id
    ).execute()
    return {"deleted": document_id}
