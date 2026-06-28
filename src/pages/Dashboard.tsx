import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, Database, Plus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

/** Ambient sparkline — a soft accent line that gives each card life without
 *  implying precise trend data. Deterministic gentle upward shape. */
function Sparkline({ color }: { color: string }) {
  const pts = [6, 5, 8, 7, 11, 9, 14, 13, 18];
  const w = 120;
  const h = 32;
  const max = Math.max(...pts);
  const step = w / (pts.length - 1);
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 4)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.08" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--hairline-strong)]">
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="opacity-70 transition-opacity group-hover:opacity-100">
          <Sparkline color={accent} />
        </div>
      </div>
      <p className="mt-4 text-[2.5rem] font-semibold leading-none tracking-tight text-[var(--text)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-xs text-[var(--text-faint)]">{sublabel}</p>
      <span
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />
    </div>
  );
}

const ACCENTS = { blue: "#3b82f6", sky: "#38bdf8", teal: "#2dd4bf" };

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.stats,
  });

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-8 py-10">
      <header className="mb-9 flex items-end justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text)]">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Your workspace at a glance.
          </p>
        </div>
        <Link
          to="/sources"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--blue-strong)]"
        >
          <Plus className="h-4 w-4" /> Connect a source
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Documents indexed"
          sublabel="Indexed and searchable"
          value={isLoading ? "—" : data?.documents_indexed ?? 0}
          icon={FileText}
          accent={ACCENTS.blue}
        />
        <StatCard
          label="Queries today"
          sublabel="In the last 24 hours"
          value={isLoading ? "—" : data?.queries_today ?? 0}
          icon={MessageSquare}
          accent={ACCENTS.sky}
        />
        <StatCard
          label="Sources connected"
          sublabel="Active integrations"
          value={isLoading ? "—" : data?.sources_connected ?? 0}
          icon={Database}
          accent={ACCENTS.teal}
        />
      </div>

      <section className="mt-8 rounded-xl border border-[var(--hairline)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Recent queries
          </h2>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--blue)] hover:underline"
          >
            Open chat <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="divide-y divide-[var(--hairline)]">
          {isLoading && (
            <li className="px-5 py-4 text-sm text-[var(--text-muted)]">Loading…</li>
          )}
          {!isLoading && (data?.recent_queries.length ?? 0) === 0 && (
            <li className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
              No queries yet. Ask your first question in the chat.
            </li>
          )}
          {data?.recent_queries.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="truncate pr-4 text-sm text-[var(--text-dim)]">
                {q.content}
              </span>
              <span className="shrink-0 text-xs text-[var(--text-faint)]">
                {new Date(q.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
