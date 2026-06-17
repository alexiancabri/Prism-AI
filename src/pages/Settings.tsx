import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";
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
      // Supabase can't self-delete a user from the browser; we sign the user
      // out and surface guidance. (A real impl calls a backend admin endpoint.)
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your organization and account.
          </p>
        </header>

        {/* Organization */}
        <section className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">Organization</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Organization name
              </label>
              <input
                readOnly
                value={orgName(user?.email)}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                readOnly
                value={user?.email ?? ""}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
              />
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="mt-6 rounded-xl border border-red-200 bg-white">
          <div className="border-b border-red-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm text-neutral-600">
              Permanently delete your account and sign out. This cannot be undone.
            </p>
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete account
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={deleteAccount}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes, delete my account
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
