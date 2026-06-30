import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePrefs } from "@/hooks/usePrefs";
import { setPref, type Prefs } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function orgName(email: string | null | undefined): string {
  if (!email) return "Workspace";
  const prefix = email.split("@")[0];
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}'s organization`;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--blue)]" : "bg-white/10",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  prefKey,
  prefs,
}: {
  title: string;
  description: string;
  prefKey: keyof Prefs;
  prefs: Prefs;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <Toggle
        checked={prefs[prefKey] as boolean}
        onChange={(v) => setPref(prefKey, v as never)}
      />
    </div>
  );
}

function Card({
  title,
  children,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        "mt-6 rounded-xl border bg-[var(--bg-card)]",
        danger ? "border-red-500/30" : "border-[var(--hairline)]",
      )}
    >
      <div
        className={cn(
          "border-b px-5 py-4",
          danger ? "border-red-500/20" : "border-[var(--hairline)]",
        )}
      >
        <h2
          className={cn(
            "text-sm font-semibold",
            danger ? "text-red-400" : "text-[var(--text)]",
          )}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const prefs = usePrefs();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("request_account_deletion");
      if (rpcError && !/function .* does not exist/i.test(rpcError.message)) {
        throw rpcError;
      }
      await signOut();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account.");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--blue)]";
  const labelCls =
    "mb-1.5 block text-xs font-medium text-[var(--text-faint)]";

  return (
    <div className="relative z-10 mx-auto max-w-2xl px-8 py-10">
      <header className="mb-9">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text)]">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Manage your profile, preferences, and account.
        </p>
      </header>

      {/* Profile */}
      <section className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--hairline)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">Profile</h2>
        </div>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-lg font-semibold text-white">
            {(prefs.displayName || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelCls}>Display name</label>
            <input
              value={prefs.displayName}
              onChange={(e) => setPref("displayName", e.target.value)}
              placeholder={user?.email?.split("@")[0] ?? "Your name"}
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">
              How Prism greets you in chat. Leave blank to use your email.
            </p>
          </div>
        </div>
      </section>

      {/* Chat preferences */}
      <Card title="Chat preferences">
        <div className="divide-y divide-[var(--hairline)]">
          <SettingRow
            title="Animate answers"
            description="Reveal responses with a typewriter effect as they generate."
            prefKey="animateAnswers"
            prefs={prefs}
          />
          <SettingRow
            title="Press Enter to send"
            description="On — Enter sends, Shift+Enter for a new line. Off — ⌘/Ctrl+Enter sends."
            prefKey="sendOnEnter"
            prefs={prefs}
          />
          <SettingRow
            title="Open sources automatically"
            description="When an answer cites a document, open the source panel right away."
            prefKey="autoOpenSources"
            prefs={prefs}
          />
          <SettingRow
            title="Show suggested prompts"
            description="Display starter prompts on the welcome screen of a new chat."
            prefKey="showSuggestions"
            prefs={prefs}
          />
        </div>
      </Card>

      {/* Organization */}
      <Card title="Organization">
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className={labelCls}>Organization name</label>
            <input readOnly value={orgName(user?.email)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input readOnly value={user?.email ?? ""} className={inputCls} />
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card title="Danger zone" danger>
        <div className="px-5 py-5">
          <p className="text-sm text-[var(--text-muted)]">
            Permanently delete your account and sign out. This cannot be undone.
          </p>
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-4 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
            >
              Delete account
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={deleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[var(--text-dim)] hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
