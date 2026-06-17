import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Send,
  Quote,
  X,
  FileText,
  Loader2,
  MessagesSquare,
} from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import {
  api,
  type Citation,
  type Message,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/** Wrap the exact quoted substring in a blue highlight. */
function Highlighted({ content, quote }: { content: string; quote: string }) {
  if (!quote || !content.includes(quote)) {
    return <span>{content}</span>;
  }
  const idx = content.indexOf(quote);
  return (
    <span>
      {content.slice(0, idx)}
      <mark className="rounded bg-indigo-100 px-0.5 text-indigo-900">
        {content.slice(idx, idx + quote.length)}
      </mark>
      {content.slice(idx + quote.length)}
    </span>
  );
}

/** Right-hand document preview that highlights the cited chunk + quote. */
function DocumentPreview({
  citation,
  onClose,
}: {
  citation: Citation;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["document", citation.document_id],
    queryFn: () => api.getDocument(citation.document_id),
  });

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="truncate text-sm font-semibold">
            {citation.document_name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
          </div>
        )}
        {data?.chunks.map((chunk) => {
          const isCited = chunk.id === citation.chunk_id;
          return (
            <div
              key={chunk.id}
              className={cn(
                "mb-3 rounded-lg border p-3 text-sm leading-relaxed",
                isCited
                  ? "border-indigo-200 bg-indigo-50/40"
                  : "border-transparent text-neutral-500",
              )}
            >
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {chunk.location}
              </div>
              {isCited ? (
                <Highlighted content={chunk.content} quote={citation.text} />
              ) : (
                <span>{chunk.content}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PendingExchange {
  question: string;
}

export default function ChatApp() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingExchange | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.listConversations,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => api.listMessages(activeId as string),
    enabled: !!activeId,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  function newConversation() {
    setActiveId(null);
    setActiveCitation(null);
    setPending(null);
  }

  async function send() {
    const question = input.trim();
    if (!question || pending) return;
    setInput("");
    setPending({ question });

    try {
      // Ensure a conversation exists.
      let convoId = activeId;
      if (!convoId) {
        const convo = await api.createConversation(
          question.length > 48 ? `${question.slice(0, 48)}…` : question,
        );
        convoId = convo.id;
        setActiveId(convoId);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      await api.addMessage(convoId, "user", question);
      const result = await api.query(question);
      await api.addMessage(convoId, "assistant", result.summary, result.citations);

      queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      // Surface the failure as an assistant-style error bubble.
      if (activeId) {
        await api
          .addMessage(
            activeId,
            "assistant",
            err instanceof Error ? `Error: ${err.message}` : "Something went wrong.",
          )
          .catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Conversation history */}
        <div className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
          <div className="p-3">
            <button
              onClick={newConversation}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {conversations.length === 0 && (
              <p className="px-3 py-4 text-sm text-neutral-400">
                No conversations yet.
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id);
                  setActiveCitation(null);
                }}
                className={cn(
                  "mb-1 flex w-full items-center gap-2 truncate rounded-lg px-3 py-2 text-left text-sm",
                  activeId === c.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col bg-neutral-50">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.length === 0 && !pending && (
                <div className="mt-20 text-center">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Ask anything about your documents
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Prism answers only from the documents you've indexed, with
                    exact quotes.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onCitationClick={setActiveCitation}
                  activeCitation={activeCitation}
                />
              ))}

              {pending && (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
                      {pending.question}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching your
                    documents…
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-neutral-200 bg-white px-6 py-4">
            <div className="mx-auto flex max-w-2xl items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask a question…"
                className="max-h-40 flex-1 resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={send}
                disabled={!input.trim() || !!pending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Document preview (slides in) */}
        {activeCitation && (
          <DocumentPreview
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}

function MessageBubble({
  message,
  onCitationClick,
  activeCitation,
}: {
  message: Message;
  onCitationClick: (c: Citation) => void;
  activeCitation: Citation | null;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  const citations = message.citations ?? [];
  return (
    <div className="space-y-3">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 shadow-sm ring-1 ring-neutral-100">
        {message.content}
      </div>

      {citations.length > 0 && (
        <div className="max-w-[85%] space-y-2">
          {citations.map((c, i) => {
            const isActive =
              activeCitation?.chunk_id === c.chunk_id &&
              activeCitation?.text === c.text;
            return (
              <button
                key={`${c.chunk_id}-${i}`}
                onClick={() => onCitationClick(c)}
                className={cn(
                  "block w-full rounded-xl border bg-white p-3 text-left transition-colors hover:border-indigo-300",
                  isActive ? "border-indigo-400 ring-2 ring-indigo-100" : "border-neutral-200",
                )}
              >
                <div className="flex items-start gap-2">
                  <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                  <p className="text-sm italic text-neutral-700">"{c.text}"</p>
                </div>
                <div className="mt-2 flex items-center gap-2 pl-5 text-xs text-neutral-400">
                  <FileText className="h-3 w-3" />
                  <span className="font-medium text-neutral-500">
                    {c.document_name}
                  </span>
                  <span>·</span>
                  <span>{c.location}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
