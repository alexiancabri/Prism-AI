"""Conversation + message persistence.

The chat client orchestrates: create a conversation, store the user message,
call POST /query for the grounded answer, then store the assistant message
(with its citations). These endpoints are plain org-scoped storage.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..auth import CurrentUser, User
from ..db import get_supabase

router = APIRouter(prefix="/conversations", tags=["conversations"])


class CreateConversation(BaseModel):
    title: str = "New conversation"


class CreateMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    citations: list[dict] = Field(default_factory=list)


@router.post("")
def create_conversation(body: CreateConversation, user: User = CurrentUser):
    sb = get_supabase()
    res = (
        sb.table("conversations")
        .insert({"org_id": user.org_id, "title": body.title})
        .execute()
    )
    return res.data[0]


@router.get("")
def list_conversations(user: User = CurrentUser):
    sb = get_supabase()
    res = (
        sb.table("conversations")
        .select("id, title, created_at")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def _assert_owned(sb, conversation_id: str, org_id: str) -> None:
    owned = (
        sb.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("org_id", org_id)
        .execute()
    )
    if not owned.data:
        raise HTTPException(404, "Conversation not found.")


@router.get("/{conversation_id}/messages")
def list_messages(conversation_id: str, user: User = CurrentUser):
    sb = get_supabase()
    _assert_owned(sb, conversation_id, user.org_id)
    res = (
        sb.table("messages")
        .select("id, role, content, citations, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return res.data


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, user: User = CurrentUser):
    sb = get_supabase()
    _assert_owned(sb, conversation_id, user.org_id)
    sb.table("messages").delete().eq("conversation_id", conversation_id).execute()
    sb.table("conversations").delete().eq("id", conversation_id).eq(
        "org_id", user.org_id
    ).execute()
    return {"ok": True}


@router.post("/{conversation_id}/messages")
def create_message(
    conversation_id: str, body: CreateMessage, user: User = CurrentUser
):
    sb = get_supabase()
    _assert_owned(sb, conversation_id, user.org_id)
    res = (
        sb.table("messages")
        .insert(
            {
                "conversation_id": conversation_id,
                "role": body.role,
                "content": body.content,
                "citations": body.citations,
            }
        )
        .execute()
    )
    return res.data[0]
