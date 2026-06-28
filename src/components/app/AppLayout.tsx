import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Database,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import FirstRun from "@/components/app/FirstRun";
import "@/styles/prism-landing.css";
import "@/styles/prism-app.css";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
  { to: "/chat", label: "Chat", icon: MessagesSquare, tour: "nav-chat" },
  { to: "/sources", label: "Sources", icon: Database, tour: "nav-sources" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, tour: "nav-settings" },
];

const PRISM_MARK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 L21 20 L3 20 Z"
      stroke="#fafafa"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function orgLabel(email: string | null | undefined): string {
  if (!email) return "Workspace";
  const prefix = email.split("@")[0];
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}'s org`;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="prism-landing prism-app">
      <div className="relative z-10 flex min-h-screen">
        <aside
          data-tour="nav"
          className="flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-black/60 py-4 backdrop-blur-xl"
        >
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center">{PRISM_MARK}</div>

          {/* Nav */}
          <nav className="mt-4 flex flex-1 flex-col gap-1.5">
            {NAV.map(({ to, label, icon: Icon, tour }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={tour}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-[rgba(59,130,246,0.12)] text-[var(--blue)]"
                      : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]",
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* User + org */}
          <div
            data-tour="account"
            className="group relative mt-2 flex flex-col items-center gap-2"
          >
            <div
              title={user?.email ?? undefined}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--blue)] text-sm font-semibold text-white"
            >
              {(user?.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {user?.email}
              <span className="block text-[10px] text-neutral-500">
                {orgLabel(user?.email)}
              </span>
            </span>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>

      <FirstRun />
    </div>
  );
}
