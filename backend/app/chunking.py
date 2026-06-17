"""Extract text from PDF/DOCX uploads and split it into embeddable chunks.

Each chunk carries a human-readable `location` (e.g. "p. 3" for PDFs,
"part 2" for Word docs) so citations can point the user at where a quote came
from.
"""
import io

import pdfplumber
from docx import Document

from . import config

Segment = tuple[str, str]  # (base_location_label, text)
Chunk = tuple[str, str]    # (content, location)


def extract_segments(filename: str, data: bytes) -> list[Segment]:
    name = filename.lower()
    if name.endswith(".pdf"):
        return _extract_pdf(data)
    if name.endswith(".docx"):
        return _extract_docx(data)
    raise ValueError("Unsupported file type. Upload a .pdf or .docx file.")


def _extract_pdf(data: bytes) -> list[Segment]:
    segments: list[Segment] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                segments.append((f"p. {i}", text))
    return segments


def _extract_docx(data: bytes) -> list[Segment]:
    doc = Document(io.BytesIO(data))
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    full = "\n".join(paras)
    return [("", full)] if full else []


def _split(text: str, size: int, overlap: int) -> list[str]:
    """Greedy character-window splitter that prefers to break on whitespace."""
    text = text.strip()
    if len(text) <= size:
        return [text] if text else []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            # back up to the last space so we don't slice a word in half
            space = text.rfind(" ", start + overlap, end)
            if space != -1:
                end = space
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks


def chunk_document(filename: str, data: bytes) -> list[Chunk]:
    """Full pipeline: bytes -> [(content, location)]."""
    segments = extract_segments(filename, data)
    chunks: list[Chunk] = []
    for label, text in segments:
        parts = _split(text, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
        for idx, part in enumerate(parts, start=1):
            if label and len(parts) > 1:
                location = f"{label} (part {idx})"
            elif label:
                location = label
            else:
                location = f"part {idx}"
            chunks.append((part, location))
    return chunks
