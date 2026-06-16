import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowUp, Quote, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrismMark } from "./PrismLogo";
import {
  answerQuestion,
  docById,
  SUGGESTED_QUESTIONS,
  type Citation,
} from "@/data/prismData";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  streaming?: boolean;
  revealCitations?: boolean;
}

interface PrismChatProps {
  variant?: "full" | "embedded";
  className?: string;
}

let idSeq = 1;

export function PrismChat({ variant = "full", className }: PrismChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || isBusy) return;
      setIsBusy(true);
      setInput("");

      const userMsg: Message = { id: idSeq++, role: "user", text: q };
      const answer = answerQuestion(q);
      const assistantId = idSeq++;
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        text: "",
        citations: answer.citations,
        streaming: true,
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);

      // Stream the summary word-by-word for a live "thinking" feel.
      const words = answer.summary.split(" ");
      let i = 0;
      const thinkDelay = window.setTimeout(() => {
        const tick = () => {
          i += 1;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId
                ? { ...msg, text: words.slice(0, i).join(" ") }
                : msg
            )
          );
          if (i < words.length) {
            const t = window.setTimeout(tick, 28);
            timers.current.push(t);
          } else {
            const done = window.setTimeout(() => {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, streaming: false, revealCitations: true }
                    : msg
                )
              );
              setIsBusy(false);
            }, 200);
            timers.current.push(done);
          }
        };
        tick();
      }, 480);
      timers.current.push(thinkDelay);
    },
    [isBusy]
  );

  const empty = messages.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl glass-strong border-spectrum",
        variant === "embedded" ? "h-[460px]" : "h-full",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
        </div>
        <div className="ml-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <PrismMark className="h-4 w-4" />
          Prism · 6 documents indexed
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Live
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {empty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <PrismMark className="h-10 w-10 animate-float" />
            <p className="mt-4 font-display text-lg font-medium text-foreground">
              Ask your documents anything
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Prism reads across your whole library and answers with direct
              quotations you can trust.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((sq) => (
                <button
                  key={sq}
                  onClick={() => ask(sq)}
                  className="rounded-full border border-border bg-secondary/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-spectrum-1/50 hover:text-foreground"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end animate-slide-up">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-spectrum-gradient bg-[length:160%] px-4 py-2.5 text-sm font-medium text-white shadow-sm">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-3 animate-slide-up">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/60">
                <Sparkles className="h-4 w-4 text-spectrum-1" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {msg.text}
                  {msg.streaming && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink rounded-sm bg-spectrum-1" />
                  )}
                </p>

                {msg.revealCitations && msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-2 animate-fade-in">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Quote className="h-3.5 w-3.5" />
                      Direct quotations
                    </p>
                    {msg.citations.map((c, idx) => (
                      <CitationCard key={idx} citation={c} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2 transition-colors focus-within:border-spectrum-1/60"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask across all your documents…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-spectrum-gradient text-white transition-all disabled:opacity-40 enabled:hover:scale-105"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  const doc = docById(citation.docId);
  const Icon = doc?.icon ?? FileText;
  return (
    <div className="group rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:border-spectrum-1/40">
      <blockquote
        className="border-l-2 pl-3 text-sm italic leading-relaxed text-foreground/80"
        style={{ borderColor: `hsl(var(--spectrum-${doc?.accent ?? "1"}))` }}
      >
        “{citation.quote}”
      </blockquote>
      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: `hsl(var(--spectrum-${doc?.accent ?? "1"}))` }}
        />
        <span className="font-medium text-foreground/80">{doc?.title ?? "Document"}</span>
        <span className="font-mono">· p.{citation.page}</span>
      </div>
    </div>
  );
}
