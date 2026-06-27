"""Document upload, listing, retrieval, and deletion.

Upload accepts a PDF/DOCX, records the document as `indexing`, and returns
immediately. A background task extracts + chunks + embeds the file and flips
the status to `ready` (or `failed`). The UI polls `GET /documents` to watch the
transition.
"""
import traceback

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from .. import config
from ..auth import CurrentUser, User
from ..chunking import chunk_document
from ..db import get_supabase
from ..embeddings import embed_texts, to_pgvector

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXT = (".pdf", ".docx")
STORAGE_BUCKET = "documents"
_CONTENT_TYPE = {
    ".pdf": "application/pdf",
    ".docx": (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ),
}


def _file_ext(name: str) -> str:
    name = (name or "").lower()
    if name.endswith(".pdf"):
        return ".pdf"
    if name.endswith(".docx"):
        return ".docx"
    return ""


def _storage_path(org_id: str, document_id: str, ext: str) -> str:
    return f"{org_id}/{document_id}{ext}"


def _ensure_bucket(sb) -> None:
    try:
        sb.storage.get_bucket(STORAGE_BUCKET)
    except Exception:  # noqa: BLE001 — bucket missing; create it (private)
        try:
            sb.storage.create_bucket(STORAGE_BUCKET)
        except Exception:  # noqa: BLE001 — race/already-exists; ignore
            pass


def _store_original(
    sb, org_id: str, document_id: str, ext: str, data: bytes
) -> None:
    """Best-effort: keep the original file so the UI can render it faithfully
    (a real PDF page, or a Word doc with formatting). A failure here must never
    break indexing — the preview falls back to extracted text."""
    ctype = _CONTENT_TYPE.get(ext)
    if not ctype:
        return
    try:
        _ensure_bucket(sb)
        sb.storage.from_(STORAGE_BUCKET).upload(
            _storage_path(org_id, document_id, ext),
            data,
            {"content-type": ctype, "upsert": "true"},
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[upload] file storage failed for {document_id}: {exc}")


def _mark_failed(sb, document_id: str, reason: str) -> None:
    """Record the failure reason; fall back gracefully if the `error` column
    hasn't been added yet (so the app still works pre-migration)."""
    try:
        sb.table("documents").update(
            {"status": "failed", "error": reason[:500]}
        ).eq("id", document_id).execute()
    except Exception:  # noqa: BLE001 — `error` column may not exist yet
        sb.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).execute()


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
                "embedding": to_pgvector(embedding),
            }
            for (content, location), embedding in zip(chunks, embeddings)
        ]
        # Insert in batches to stay well under request-size limits.
        for i in range(0, len(rows), 100):
            sb.table("chunks").insert(rows[i : i + 100]).execute()

        try:
            sb.table("documents").update({"status": "ready", "error": None}).eq(
                "id", document_id
            ).execute()
        except Exception:  # noqa: BLE001 — `error` column may not exist yet
            sb.table("documents").update({"status": "ready"}).eq(
                "id", document_id
            ).execute()
    except Exception as exc:  # noqa: BLE001 — mark failed, surface the reason
        print(f"[index] document {document_id} failed: {exc}")
        traceback.print_exc()
        _mark_failed(sb, document_id, str(exc))


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

    ext = _file_ext(filename)
    if ext:
        _store_original(sb, user.org_id, document["id"], ext, data)

    background_tasks.add_task(
        _index_document, document["id"], user.org_id, filename, data
    )
    return document


@router.get("")
def list_documents(user: User = CurrentUser):
    sb = get_supabase()
    res = (
        sb.table("documents")
        .select("*")
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
        .select("*")
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


@router.get("/{document_id}/file")
def get_document_file(document_id: str, user: User = CurrentUser):
    """Signed URL + kind ('pdf' | 'docx') for the original file so the browser
    can render it faithfully.

    Returns 404 when the document has no renderable original (unsupported type,
    or uploaded before file storage existed) — the UI falls back to the
    extracted-text preview.
    """
    sb = get_supabase()
    doc = (
        sb.table("documents")
        .select("name")
        .eq("id", document_id)
        .eq("org_id", user.org_id)
        .execute()
    )
    if not doc.data:
        raise HTTPException(404, "Document not found.")
    ext = _file_ext(doc.data[0]["name"])
    if not ext:
        raise HTTPException(404, "No file preview available for this document.")

    try:
        res = sb.storage.from_(STORAGE_BUCKET).create_signed_url(
            _storage_path(user.org_id, document_id, ext), 3600
        )
    except Exception as exc:  # noqa: BLE001 — file may predate file storage
        raise HTTPException(404, "File not available.") from exc

    url = res.get("signedURL") or res.get("signedUrl") or res.get("signed_url")
    if not url:
        raise HTTPException(404, "File not available.")
    if url.startswith("/"):
        url = config.SUPABASE_URL.rstrip("/") + url
    return {"url": url, "kind": "pdf" if ext == ".pdf" else "docx"}


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
    try:  # remove the stored original too; ignore if it never existed
        sb.storage.from_(STORAGE_BUCKET).remove(
            [
                _storage_path(user.org_id, document_id, ".pdf"),
                _storage_path(user.org_id, document_id, ".docx"),
            ]
        )
    except Exception:  # noqa: BLE001
        pass
    return {"deleted": document_id}
