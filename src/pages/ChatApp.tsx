import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Document, Page } from "react-pdf";
import {
  Plus,
  Send,
  X,
  FileText,
  Loader2,
  MessagesSquare,
} from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import { api, type Citation, type Message, type DocumentDetail } from "@/lib/api";
import { makeHighlighter, pageFromLocation } from "@/lib/pdf";
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
      <mark className="rounded bg-[#3b82f6]/30 px-0.5 text-[#bfd4ff]">
        {content.slice(idx, idx + quote.length)}
      </mark>
      {content.slice(idx + quote.length)}
    </span>
  );
}

/** Right-hand document preview: renders the real PDF with the cited region
 *  highlighted; falls back to extracted-text chunks for non-PDF documents or
 *  ones uploaded before the original file was stored. */
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

  const { data: fileData } = useQuery({
    queryKey: ["document-file", citation.document_id],
    queryFn: () => api.getDocumentFile(citation.document_id),
    retry: false,
  });

  const [pdfError, setPdfError] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset the PDF-failure state when the citation points at a new document.
  useEffect(() => setPdfError(false), [citation.document_id]);

  const isPdf =
    citation.document_name.toLowerCase().endsWith(".pdf") &&
    !!fileData?.url &&
    !pdfError;
  const page = pageFromLocation(citation.location);
  const renderHighlight = useMemo(
    () => makeHighlighter(citation.text),
    [citation.text],
  );

  function scrollToHighlight() {
    bodyRef.current
      ?.querySelector("mark.pdf-hl")
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div className="flex h-full w-[440px] shrink-0 flex-col border-l border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="truncate text-sm font-semibold text-neutral-100">
            {citation.document_name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={bodyRef}
        className={cn(
          "flex-1 overflow-auto",
          isPdf ? "bg-neutral-900/50 px-4 py-4" : "px-5 py-4",
        )}
      >
        {isPdf ? (
          <Document
            file={fileData!.url}
            onLoadError={() => setPdfError(true)}
            loading={
              <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={page}
              width={400}
              customTextRenderer={renderHighlight}
              onRenderTextLayerSuccess={scrollToHighlight}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          <DocumentTextView
            data={data}
            isLoading={isLoading}
            citation={citation}
          />
        )}
      </div>
    </div>
  );
}

/** Fallback: the extracted-text chunk list with the cited quote highlighted. */
function DocumentTextView({
  data,
  isLoading,
  citation,
}: {
  data: DocumentDetail | undefined;
  isLoading: boolean;
  citation: Citation;
}) {
  return (
    <>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
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
                ? "border-[#3b82f6]/30 bg-[#3b82f6]/[0.06] text-neutral-200"
                : "border-transparent text-neutral-500",
            )}
          >
            <div className="app-mono mb-1 text-[10px] uppercase tracking-wider text-neutral-600">
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
    </>
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

    // Track the conversation id outside the try so the catch can attach an
    // error message even when this is the first message of a brand-new chat
    // (activeId state hasn't updated yet at that point).
    let convoId = activeId;
    try {
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
      if (convoId) {
        await api
          .addMessage(
            convoId,
            "assistant",
            err instanceof Error ? `Error: ${err.message}` : "Something went wrong.",
          )
          .catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <AppLayout>
      <div className="relative z-10 flex h-screen">
        {/* Conversation history */}
        <div className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-black/40">
          <div className="p-3">
            <button
              onClick={newConversation}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3b82f6]"
            >
              <Plus className="h-4 w-4" /> New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {conversations.length === 0 && (
              <p className="px-3 py-4 text-sm text-neutral-600">
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
                    ? "bg-[#3b82f6]/10 text-[#3b82f6]"
                    : "text-neutral-400 hover:bg-white/5",
                )}
              >
                <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.length === 0 && !pending && (
                <div className="mt-20 text-center">
                  <h2 className="text-lg font-semibold text-neutral-100">
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
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#2563eb] px-4 py-2.5 text-sm text-white">
                      {pending.question}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching your
                    documents…
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 px-6 py-4">
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
                className="max-h-40 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-[#3b82f6]/60"
              />
              <button
                onClick={send}
                disabled={!input.trim() || !!pending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white hover:bg-[#3b82f6] disabled:opacity-50"
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
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#2563eb] px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  const citations = message.citations ?? [];
  return (
    <div className="space-y-3">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-neutral-200">
        {message.content}
      </div>

      {citations.length > 0 && (
        <div className="max-w-[85%]">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
            Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {citations.map((c, i) => {
              const isActive =
                activeCitation?.chunk_id === c.chunk_id &&
                activeCitation?.text === c.text;
              return (
                <button
                  key={`${c.chunk_id}-${i}`}
                  onClick={() => onCitationClick(c)}
                  title={c.text}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-[#3b82f6]/50 hover:bg-[#3b82f6]/[0.06]",
                    isActive
                      ? "border-[#3b82f6]/60 bg-[#3b82f6]/10 text-[#bfd4ff]"
                      : "border-white/10 bg-white/[0.02] text-neutral-400",
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/20 text-[10px] font-semibold text-[#3b82f6]">
                    {i + 1}
                  </span>
                  <FileText className="h-3 w-3 shrink-0 text-neutral-500" />
                  <span className="truncate font-medium">{c.document_name}</span>
                  <span className="shrink-0 text-neutral-600">·</span>
                  <span className="shrink-0 whitespace-nowrap text-neutral-500">
                    {c.location}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
