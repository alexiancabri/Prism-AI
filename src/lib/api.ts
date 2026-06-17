import { supabase } from "./supabase";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ---- Shared response shapes -------------------------------------------------
export interface DocumentRow {
  id: string;
  name: string;
  size: number;
  status: "indexing" | "ready" | "failed";
  created_at: string;
}

export interface Citation {
  text: string;
  document_name: string;
  document_id: string;
  chunk_id: string;
  location: string;
}

export interface QueryResult {
  summary: string;
  citations: Citation[];
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  location: string;
}

export interface DocumentDetail extends DocumentRow {
  chunks: DocumentChunk[];
}

export interface DashboardStats {
  documents_indexed: number;
  queries_today: number;
  sources_connected: number;
  recent_queries: { id: string; content: string; created_at: string }[];
}

// ---- Core fetch wrapper -----------------------------------------------------
async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(await authHeader()),
    ...((init.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- API surface ------------------------------------------------------------
export const api = {
  // documents
  listDocuments: () => request<DocumentRow[]>("/documents"),
  getDocument: (id: string) => request<DocumentDetail>(`/documents/${id}`),
  deleteDocument: (id: string) =>
    request<{ deleted: string }>(`/documents/${id}`, { method: "DELETE" }),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentRow>("/documents/upload", {
      method: "POST",
      body: form,
    });
  },

  // query (RAG)
  query: (question: string) =>
    request<QueryResult>("/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  // conversations
  listConversations: () => request<Conversation[]>("/conversations"),
  createConversation: (title: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  listMessages: (conversationId: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages`),
  addMessage: (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    citations: Citation[] = [],
  ) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ role, content, citations }),
    }),

  // dashboard
  stats: () => request<DashboardStats>("/stats"),
};
