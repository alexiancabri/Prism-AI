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
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  Search,
  ListChecks,
  Quote,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, type Citation, type Message, type DocumentDetail } from "@/lib/api";
import { makeHighlighter, pageFromLocation } from "@/lib/pdf";
import { highlightDocParagraph } from "@/lib/docx";
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

  const [fileError, setFileError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(440);
  const [dragging, setDragging] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(400);
  const bodyRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Reset the file-failure state when the citation points at a new document.
  useEffect(() => setFileError(false), [citation.document_id]);

  // Drag-to-resize: the panel hugs the right edge, so its width is the distance
  // from the pointer to the window's right edge. Clamp so neither the chat nor
  // the document can be squeezed away. Listeners live on window so the drag
  // keeps tracking even when the pointer outruns the thin handle.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const next = window.innerWidth - e.clientX;
      setWidth(Math.max(360, Math.min(next, window.innerWidth - 420)));
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    setExpanded(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function toggleExpand() {
    setExpanded((v) => {
      const next = !v;
      setWidth(next ? Math.min(960, window.innerWidth * 0.75) : 440);
      return next;
    });
  }

  // Render the PDF at the panel's actual inner width so it scales up when the
  // panel is expanded (and down on narrow screens), minus horizontal padding.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setPdfWidth(Math.max(280, el.clientWidth - 32));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const kind = fileData?.kind;
  const hasFile = !!fileData?.url && !fileError;
  const isPdf = kind === "pdf" && hasFile;
  const isDocx = kind === "docx" && hasFile;
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

  /** Open the original file in a new tab. For PDFs we fetch the bytes and open
   *  them as an application/pdf blob (jumping to the cited page) — a raw signed
   *  URL often downloads or opens blank instead of rendering inline. The tab is
   *  opened synchronously first so it isn't caught by the popup blocker. */
  async function openOriginal() {
    if (!fileData?.url) return;
    if (!isPdf) {
      window.open(fileData.url, "_blank", "noopener,noreferrer");
      return;
    }
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const blob = await fetch(fileData.url).then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      });
      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      const target = page > 1 ? `${blobUrl}#page=${page}` : blobUrl;
      if (tab) tab.location.href = target;
      else window.open(target, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      // Fall back to the signed URL if the fetch is blocked for any reason.
      if (tab) tab.location.href = fileData.url;
      else window.open(fileData.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      style={{ width }}
      className={cn(
        "relative flex h-full shrink-0 flex-col border-l border-white/10 bg-black/40",
        !dragging && "transition-[width] duration-200 ease-in-out",
      )}
    >
      {/* Drag handle on the chat↔document divider */}
      <div
        onPointerDown={startDrag}
        onDoubleClick={toggleExpand}
        title="Drag to resize · double-click to expand"
        className="group absolute left-0 top-0 z-20 flex h-full w-2 -translate-x-1/2 cursor-col-resize items-center justify-center"
      >
        <div
          className={cn(
            "h-full w-px transition-colors",
            dragging ? "bg-[#3b82f6]" : "bg-white/10 group-hover:bg-[#3b82f6]/60",
          )}
        />
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="truncate text-sm font-semibold text-neutral-100">
            {citation.document_name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasFile && (
            <button
              onClick={openOriginal}
              title="Open original document"
              className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleExpand}
            title={expanded ? "Collapse panel" : "Expand panel"}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
            onLoadError={() => setFileError(true)}
            loading={
              <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={page}
              width={pdfWidth}
              customTextRenderer={renderHighlight}
              onRenderTextLayerSuccess={scrollToHighlight}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : isDocx ? (
          <DocxView
            url={fileData!.url}
            quote={citation.text}
            onError={() => setFileError(true)}
          />
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

/** Renders a .docx as formatted HTML (via mammoth) and highlights the cited
 *  paragraph. Falls back (via onError) to the extracted-text view on failure. */
function DocxView({
  url,
  quote,
  onError,
}: {
  url: string;
  quote: string;
  onError: () => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    (async () => {
      try {
        const buf = await fetch(url).then((r) => {
          if (!r.ok) throw new Error("fetch failed");
          return r.arrayBuffer();
        });
        const mammoth = await import("mammoth");
        const { value } = await mammoth.convertToHtml({ arrayBuffer: buf });
        if (!cancelled) setHtml(value);
      } catch {
        if (!cancelled) onErrorRef.current();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (html && ref.current) highlightDocParagraph(ref.current, quote);
  }, [html, quote]);

  if (html === null) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="doc-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
  // Id of the freshly generated assistant message to reveal with a typewriter
  // effect (cleared once done, so switching chats / reloads don't re-animate).
  const [typingId, setTypingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }
  // Synchronous send guard — the `pending` state check is async and a rapid
  // double event (Enter + click, double Enter) can slip past it and post twice.
  const sendingRef = useRef(false);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.listConversations,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => api.listMessages(activeId as string),
    enabled: !!activeId,
    // Avoid a stray refetch mid-send that could momentarily show the just-sent
    // message alongside the optimistic bubble.
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  function newConversation() {
    setActiveId(null);
    setActiveCitation(null);
    setPending(null);
  }

  // Prefill the composer with a suggested prompt and focus it so the user can
  // edit or just hit Enter.
  function pickSuggestion(prompt: string) {
    setInput(prompt);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  async function send() {
    const question = input.trim();
    if (!question || sendingRef.current) return;
    sendingRef.current = true;
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
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      const userMsg = await api.addMessage(convoId, "user", question);
      const result = await api.query(question);
      const assistantMsg = await api.addMessage(
        convoId,
        "assistant",
        result.summary,
        result.citations,
      );

      // Seed the cache with the real messages, THEN activate the conversation,
      // so the optimistic bubble is swapped for the stored messages in a single
      // render — no window where both a fetched copy and the pending bubble show.
      // (For a new chat we deliberately delay setActiveId until here so the
      // messages query doesn't fetch the half-finished exchange mid-flight.)
      queryClient.setQueryData<Message[]>(["messages", convoId], (old) => [
        ...(old ?? []),
        userMsg,
        assistantMsg,
      ]);
      setTypingId(assistantMsg.id);
      if (activeId !== convoId) setActiveId(convoId);
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
        if (activeId !== convoId) setActiveId(convoId);
        queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
      }
    } finally {
      setPending(null);
      sendingRef.current = false;
    }
  }

  return (
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
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.length === 0 && !pending && (
                <WelcomeScreen onPick={pickSuggestion} />
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onCitationClick={setActiveCitation}
                  activeCitation={activeCitation}
                  animate={m.id === typingId}
                  onTick={scrollToBottom}
                  onTypingDone={() => setTypingId(null)}
                />
              ))}

              {pending && (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#2563eb] px-4 py-2.5 text-sm text-white">
                      {pending.question}
                    </div>
                  </div>
                  <ThinkingIndicator question={pending.question} />
                </>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 px-6 py-4">
            <div className="mx-auto flex max-w-2xl items-end gap-2">
              <textarea
                ref={inputRef}
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
  );
}

/** Pull a short topic out of the question so the thinking states can name it,
 *  by stripping the common leading phrasing ("what is", "find passages about"…).
 *  Returns null when the remainder is too long to read as a tidy topic. */
function deriveTopic(question: string): string | null {
  let q = question.trim().replace(/[?.!]+$/, "");
  const patterns = [
    /^find (?:the )?(?:exact )?(?:passages?|quotes?|info(?:rmation)?)\s+(?:about|on|for|regarding)\s+/i,
    /^compare (?:what (?:my )?documents? say about\s+)?/i,
    /^give me a (?:concise )?summary of\s+/i,
    /^summari[sz]e\s+/i,
    /^what (?:do|does) (?:my )?documents? say about\s+/i,
    /^what(?:'s| is| are| was| were)\s+(?:the\s+)?/i,
    /^(?:tell me about|look(?: something)? up|explain|describe|how (?:do|does|to))\s+/i,
  ];
  for (const p of patterns) {
    if (p.test(q)) {
      q = q.replace(p, "").trim();
      break;
    }
  }
  if (!q || q.length > 40 || q.split(/\s+/).length > 6) return null;
  return q;
}

/** Animated "thinking" indicator: a pulsing orb plus staged status messages
 *  that adapt to the question and shimmer while the answer is generated. */
function ThinkingIndicator({ question }: { question: string }) {
  const stages = useMemo(() => {
    const topic = deriveTopic(question);
    return topic
      ? [
          "Reading your documents",
          `Searching for “${topic}”`,
          "Pulling the most relevant passages",
          "Composing an answer",
        ]
      : [
          "Reading your documents",
          "Finding relevant passages",
          "Cross-referencing your sources",
          "Composing an answer",
        ];
  }, [question]);

  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(
      () => setI((prev) => (prev < stages.length - 1 ? prev + 1 : prev)),
      2200,
    );
    return () => clearInterval(id);
  }, [stages]);

  return (
    <div className="flex items-center gap-3">
      <span className="thinking-orb" aria-hidden="true" />
      <div key={i} className="thinking-fade">
        <span className="thinking-text text-sm">
          {stages[i]}
          <span className="thinking-dots" />
        </span>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: "Summarize my documents",
    prompt: "Give me a concise summary of the key points across my documents.",
  },
  {
    icon: Quote,
    title: "Pull exact quotes",
    prompt: "Find the exact passages about ",
  },
  {
    icon: ListChecks,
    title: "Compare details",
    prompt: "Compare what my documents say about ",
  },
  {
    icon: Search,
    title: "Look something up",
    prompt: "What do my documents say about ",
  },
];

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Claude-style empty state: a glowing brand mark, a time-aware greeting, and
 *  clickable suggestion cards that prefill the composer. */
function WelcomeScreen({ onPick }: { onPick: (prompt: string) => void }) {
  const { user } = useAuth();
  const handle = user?.email?.split("@")[0];
  const name = handle
    ? handle.charAt(0).toUpperCase() + handle.slice(1)
    : null;

  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center px-4 text-center">
      {/* Glowing brand mark */}
      <div className="relative mb-7">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#7c5cff] opacity-30 blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3 L21 20 L3 20 Z"
              stroke="#fafafa"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M7 20 L15.5 6"
              stroke="#3b82f6"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
        {greetingFor(new Date().getHours())}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
        Ask anything about your documents. Prism answers only from what you've
        indexed — with exact quotes and sources.
      </p>

      <div className="mt-9 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            onClick={() => onPick(prompt)}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition-all hover:border-[#3b82f6]/40 hover:bg-white/[0.04]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/10 text-[#3b82f6]">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium text-neutral-200">
              {title}
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-600 transition-colors group-hover:text-[#3b82f6]" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Reveal `text` with a typewriter effect, capped to a short duration so even
 *  long answers finish quickly (no real waiting). Returns the visible slice and
 *  whether it's finished. When `enabled` is false the full text shows at once. */
function useTypewriter(
  text: string,
  enabled: boolean,
  onTick?: () => void,
  onDone?: () => void,
) {
  const [shown, setShown] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  const cbs = useRef({ onTick, onDone });
  cbs.current = { onTick, onDone };

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      setDone(true);
      return;
    }
    let raf = 0;
    const duration = Math.min(900, Math.max(250, text.length * 9));
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(text.slice(0, Math.floor(p * text.length)));
      cbs.current.onTick?.();
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setShown(text);
        setDone(true);
        cbs.current.onDone?.();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  return { shown, done };
}

function MessageBubble({
  message,
  onCitationClick,
  activeCitation,
  animate,
  onTick,
  onTypingDone,
}: {
  message: Message;
  onCitationClick: (c: Citation) => void;
  activeCitation: Citation | null;
  animate: boolean;
  onTick: () => void;
  onTypingDone: () => void;
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

  return (
    <AssistantBubble
      message={message}
      onCitationClick={onCitationClick}
      activeCitation={activeCitation}
      animate={animate}
      onTick={onTick}
      onTypingDone={onTypingDone}
    />
  );
}

function AssistantBubble({
  message,
  onCitationClick,
  activeCitation,
  animate,
  onTick,
  onTypingDone,
}: {
  message: Message;
  onCitationClick: (c: Citation) => void;
  activeCitation: Citation | null;
  animate: boolean;
  onTick: () => void;
  onTypingDone: () => void;
}) {
  const { shown, done } = useTypewriter(
    message.content,
    animate,
    onTick,
    onTypingDone,
  );
  const citations = message.citations ?? [];
  return (
    <div className="space-y-3">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-neutral-200">
        {shown}
        {!done && <span className="type-caret" aria-hidden="true" />}
      </div>

      {citations.length > 0 && done && (
        <div className="thinking-fade max-w-[85%]">
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
