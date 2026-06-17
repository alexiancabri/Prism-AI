"""Dashboard stats + recent queries.

`messages` has no `org_id` column, so message stats are scoped by first
resolving the org's conversation ids and filtering messages to those.
"""
from datetime import datetime, timezone

from fastapi import APIRouter

from ..auth import CurrentUser, User
from ..db import get_supabase

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def dashboard_stats(user: User = CurrentUser):
    sb = get_supabase()
    org = user.org_id

    docs = (
        sb.table("documents").select("id, status").eq("org_id", org).execute().data
    )
    documents_indexed = sum(1 for d in docs if d["status"] == "ready")
    sources_connected = 1 if docs else 0  # PDF/Word upload is the live source

    convo_ids = [
        c["id"]
        for c in sb.table("conversations")
        .select("id")
        .eq("org_id", org)
        .execute()
        .data
    ]

    queries_today = 0
    recent: list[dict] = []
    if convo_ids:
        start_of_day = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today = (
            sb.table("messages")
            .select("id", count="exact")
            .in_("conversation_id", convo_ids)
            .eq("role", "user")
            .gte("created_at", start_of_day.isoformat())
            .execute()
        )
        queries_today = today.count or 0

        recent = (
            sb.table("messages")
            .select("id, content, created_at")
            .in_("conversation_id", convo_ids)
            .eq("role", "user")
            .order("created_at", desc=True)
            .limit(8)
            .execute()
            .data
        )

    return {
        "documents_indexed": documents_indexed,
        "queries_today": queries_today,
        "sources_connected": sources_connected,
        "recent_queries": recent,
    }
