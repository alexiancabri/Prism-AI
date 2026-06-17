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
          className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 px-5 py-5">
            {PRISM_MARK}
            <span className="text-[17px] font-semibold tracking-tight">Prism AI</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
            {NAV.map(({ to, label, icon: Icon, tour }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={tour}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#3b82f6]/10 text-[#3b82f6]"
                      : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + org */}
          <div className="border-t border-white/10 p-3">
            <div
              data-tour="account"
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#7c5cff] text-sm font-semibold text-white">
                {(user?.email ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-100">
                  {user?.email}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {orgLabel(user?.email)}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>

      <FirstRun />
    </div>
  );
}
