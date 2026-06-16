import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, PanelLeftClose, PanelLeft, FolderOpen } from "lucide-react";
import { PrismLogo } from "@/components/prism/PrismLogo";
import { PrismChat } from "@/components/prism/PrismChat";
import { DOCUMENTS } from "@/data/prismData";
import { cn } from "@/lib/utils";

const RECENT = [
  "M&A retention policy",
  "Non-compete duration",
  "Acme liability cap",
  "Q4 revenue growth",
];

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatKey, setChatKey] = useState(0);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Subtle workspace texture */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-dots opacity-50" />

      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-10 flex h-full shrink-0 flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <Link to="/">
            <PrismLogo />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={() => setChatKey((k) => k + 1)}
            className="flex w-full items-center gap-2 rounded-xl bg-spectrum-gradient bg-[length:200%_auto] px-3.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[position:100%]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search library…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <div className="mt-2 space-y-0.5">
            {RECENT.map((r) => (
              <button
                key={r}
                className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            Documents · {DOCUMENTS.length}
          </p>
          <div className="mt-2 space-y-1">
            {DOCUMENTS.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary"
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: `hsl(var(--spectrum-${doc.accent}))` }}
                  />
                  <span className="truncate text-sm text-foreground/80">{doc.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spectrum-gradient text-sm font-semibold text-white">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Alex Cabri</p>
              <p className="truncate text-xs text-muted-foreground">Team plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Open sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="font-display text-base font-semibold text-foreground">
              Workspace · Legal & Finance
            </h1>
            <p className="text-xs text-muted-foreground">
              {DOCUMENTS.length} documents · indexed and ready
            </p>
          </div>
          <Link
            to="/"
            className="ml-auto rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to site
          </Link>
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6">
          <div className="mx-auto h-full max-w-3xl">
            <PrismChat key={chatKey} variant="full" className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
