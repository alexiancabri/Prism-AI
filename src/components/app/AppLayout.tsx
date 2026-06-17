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

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/sources", label: "Sources", icon: Database },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

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
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Prism AI</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + org */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
              {(user?.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="truncate text-xs text-neutral-500">
                {orgLabel(user?.email)}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
