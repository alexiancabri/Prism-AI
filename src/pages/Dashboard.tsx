import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, Database, Plus, ArrowRight } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import { api } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <span className="app-kicker">{label}</span>
        <Icon className="h-4 w-4 text-neutral-600" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-100">
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.stats,
  });

  return (
    <AppLayout>
      <div className="relative z-10 mx-auto max-w-5xl px-8 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Your workspace at a glance.
            </p>
          </div>
          <Link
            to="/sources"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82f6]"
          >
            <Plus className="h-4 w-4" /> Connect a source
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Documents indexed"
            value={isLoading ? "—" : data?.documents_indexed ?? 0}
            icon={FileText}
          />
          <StatCard
            label="Queries today"
            value={isLoading ? "—" : data?.queries_today ?? 0}
            icon={MessageSquare}
          />
          <StatCard
            label="Sources connected"
            value={isLoading ? "—" : data?.sources_connected ?? 0}
            icon={Database}
          />
        </div>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-100">
              Recent queries
            </h2>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#3b82f6] hover:underline"
            >
              Open chat <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {isLoading && (
              <li className="px-5 py-4 text-sm text-neutral-500">Loading…</li>
            )}
            {!isLoading && (data?.recent_queries.length ?? 0) === 0 && (
              <li className="px-5 py-8 text-center text-sm text-neutral-500">
                No queries yet. Ask your first question in the chat.
              </li>
            )}
            {data?.recent_queries.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="truncate pr-4 text-sm text-neutral-300">
                  {q.content}
                </span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {new Date(q.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
