import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

function orgName(email: string | null | undefined): string {
  if (!email) return "Workspace";
  const prefix = email.split("@")[0];
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}'s organization`;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300";

  return (
    <div className="relative z-10 mx-auto max-w-2xl px-8 py-10">
        <header className="mb-9">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text)]">
            Settings
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Manage your organization and account.
          </p>
        </header>

        {/* Organization */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-100">Organization</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="app-kicker mb-1.5 block">Organization name</label>
              <input readOnly value={orgName(user?.email)} className={inputCls} />
            </div>
            <div>
              <label className="app-kicker mb-1.5 block">Email</label>
              <input readOnly value={user?.email ?? ""} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="mt-6 rounded-xl border border-red-500/30 bg-white/[0.02]">
          <div className="border-b border-red-500/20 px-5 py-4">
            <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm text-neutral-400">
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
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
    </div>
  );
}
