"""Supabase JWT auth.

Every protected endpoint depends on `current_user`, which:
  1. validates the `Authorization: Bearer <jwt>` access token by asking Supabase
     who it belongs to (`auth.get_user(token)`) — this works regardless of the
     project's JWT signing algorithm (legacy HS256 or the newer asymmetric
     signing keys), unlike decoding the token locally with a shared secret, then
  2. resolves the caller's org via the `profiles` table, provisioning an
     org + profile on the fly if a DB trigger hasn't already (so the API is
     usable even on a project without the trigger installed).
"""
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from .db import get_supabase


@dataclass
class User:
    id: str
    email: str | None
    org_id: str


def _verify_token(token: str) -> tuple[str, str | None]:
    """Validate the access token with Supabase; return (user_id, email)."""
    try:
        resp = get_supabase().auth.get_user(token)
    except Exception as exc:  # gotrue raises on invalid/expired tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        ) from exc

    user = getattr(resp, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token did not resolve to a user.",
        )
    return user.id, getattr(user, "email", None)


def _get_or_create_org(user_id: str, email: str | None) -> str:
    """Return the caller's org_id, creating an org + profile if needed."""
    sb = get_supabase()

    existing = sb.table("profiles").select("org_id").eq("id", user_id).execute()
    if existing.data and existing.data[0].get("org_id"):
        return existing.data[0]["org_id"]

    # No profile yet (trigger absent or mid-race) — bootstrap one.
    org_name = (email.split("@")[0] if email else "New") + "'s organization"
    org = sb.table("orgs").insert({"name": org_name}).execute()
    org_id = org.data[0]["id"]
    sb.table("profiles").upsert(
        {"id": user_id, "org_id": org_id, "email": email}
    ).execute()
    return org_id


def current_user(authorization: str = Header(None)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )
    token = authorization.split(" ", 1)[1].strip()
    user_id, email = _verify_token(token)
    org_id = _get_or_create_org(user_id, email)
    return User(id=user_id, email=email, org_id=org_id)


CurrentUser = Depends(current_user)
