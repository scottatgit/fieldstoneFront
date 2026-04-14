"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { adminFetchDirect } from "@/lib/adminFetch";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tenant_id: string;
  subdomain: string | null;
  role: string;
  created_at: string | null;
  last_active_at: string | null;
  has_password: boolean;
  login_healthy: boolean;
  issues: string[];
  totp_enabled: boolean;
}
interface Tenant { id: string; subdomain: string; }

function HealthBadge({ healthy }: { healthy: boolean }) {
  return healthy
    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Healthy</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Broken</span>;
}

function MfaBadge({ enabled }: { enabled: boolean }) {
  return enabled
    ? <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />MFA On</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">No MFA</span>;
}

function RoleBadge({ role }: { role: string }) {
  const s: Record<string, string> = {
    platform_admin: "bg-purple-100 text-purple-700",
    tenant_admin: "bg-blue-100 text-blue-700",
    technician: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s[role] ?? "bg-slate-100 text-slate-600"}`}>{role.replace("_", " ")}</span>;
}

function CreateModal({ tenants, onClose, onCreated }: { tenants: Tenant[]; onClose: () => void; onCreated: () => void; }) {
  const [form, setForm] = useState({ email: "", name: "", password: "", tenant_id: "", role: "technician" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await adminFetchDirect("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      onCreated(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Create User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {(["email", "name", "password"] as const).map(k => (
            <div key={k}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{k}</label>
              <input type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
            <select value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))} required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select tenant...</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.subdomain}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="technician">Technician</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="platform_admin">Platform Admin</option>
            </select>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? "Creating..." : "Create User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetModal({ user, onClose, onReset }: { user: AdminUser; onClose: () => void; onReset: () => void; }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await adminFetchDirect(`/api/admin/users/${user.id}/reset-password`, { method: "POST", body: JSON.stringify({ new_password: pw }) });
      setDone(true); onReset();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Reset Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500 mb-4">For <span className="font-medium text-slate-700">{user.email}</span></p>
          {done
            ? <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Password updated. User can now log in.</div>
            : <form onSubmit={submit} className="space-y-4">
                <input type="password" placeholder="New password (min 8 chars)" value={pw}
                  onChange={e => setPw(e.target.value)} required minLength={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? "Saving..." : "Set Password"}</button>
                </div>
              </form>
          }
        </div>
      </div>
    </div>
  );
}

// FST-037: Platform-admin MFA reset modal.
// Calls POST /api/admin/users/{id}/mfa/reset. Explains consequences before execution.
function MfaResetModal({ user, onClose, onReset }: { user: AdminUser; onClose: () => void; onReset: () => void; }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  async function confirm() {
    setError(""); setLoading(true);
    try {
      await adminFetchDirect(`/api/admin/users/${user.id}/mfa/reset`, { method: "POST" });
      setDone(true); onReset();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Reset failed"); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Reset MFA</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-500">For <span className="font-medium text-slate-700">{user.email}</span></p>
          {done ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              MFA cleared. User must re-enrol from their security settings.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
                <p className="font-medium">This will permanently:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Disable TOTP for this account</li>
                  <li>Delete the authenticator secret</li>
                  <li>Delete all recovery codes</li>
                </ul>
                <p className="pt-1">The user will need to re-enrol MFA from their security settings.</p>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={confirm} disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {loading ? "Resetting..." : "Reset MFA"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "broken" | "healthy">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [mfaResetTarget, setMfaResetTarget] = useState<AdminUser | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (isLoaded && user?.role !== "platform_admin") router.replace("/platform");
  }, [user, isLoaded, router]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ur, tr] = await Promise.all([
        adminFetchDirect("/api/admin/users") as Promise<{ users: AdminUser[] }>,
        adminFetchDirect("/api/admin/tenants-list") as Promise<{ tenants: Tenant[] }>,
      ]);
      setUsers(ur.users); setTenants(tr.tenants); setLastRefresh(new Date());
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isLoaded && user?.role === "platform_admin") void load();
  }, [isLoaded, user, load]);

  const displayed = users.filter(u => {
    const q = search.toLowerCase();
    const ms = !q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q) || (u.subdomain ?? "").toLowerCase().includes(q);
    const mf = filter === "all" || (filter === "broken" && !u.login_healthy) || (filter === "healthy" && u.login_healthy);
    return ms && mf;
  });
  const brokenCount = users.filter(u => !u.login_healthy).length;

  if (!isLoaded || user?.role !== "platform_admin") return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              {users.length} user{users.length !== 1 ? "s" : ""}
              {brokenCount > 0 && <span className="ml-2 font-medium text-red-600">&middot; {brokenCount} broken</span>}
              {brokenCount === 0 && users.length > 0 && <span className="ml-2 text-green-600">&middot; all healthy</span>}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <span className="text-lg leading-none">+</span> New User
          </button>
        </div>

        {brokenCount > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-red-500 font-bold mt-0.5">!</span>
            <p className="text-sm text-red-700">
              <strong>{brokenCount} account{brokenCount !== 1 ? "s" : ""} cannot log in.</strong>{" "}
              Use <strong>Reset Password</strong> for broken hashes. Tenant join failures need{" "}
              <code className="bg-red-100 px-1 rounded text-xs">repair_tenant_ids.py --fix</code> on the server.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input type="search" placeholder="Search email, name, tenant..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="flex gap-2">
            {(["all", "broken", "healthy"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  filter === f ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
            <button onClick={() => void load()} disabled={loading} title="Refresh"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              {loading ? "..." : "↻"}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading...</div>
          ) : displayed.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">No users match</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Login Health</th>
                    <th className="px-4 py-3">MFA</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayed.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50 ${!u.login_healthy ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{u.name || <span className="italic text-slate-400">No name</span>}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {u.subdomain
                          ? <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{u.subdomain}</code>
                          : <span className="font-mono text-xs text-red-500">{u.tenant_id}</span>}
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <HealthBadge healthy={u.login_healthy} />
                          {u.issues.map((issue, i) => <span key={i} className="text-xs text-red-500">{issue}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MfaBadge enabled={u.totp_enabled} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : <span className="text-slate-300">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setResetTarget(u)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                            Reset Password
                          </button>
                          {u.totp_enabled && (
                            <button onClick={() => setMfaResetTarget(u)}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                              Reset MFA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Showing {displayed.length} of {users.length} &middot; Refreshed {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      {showCreate && <CreateModal tenants={tenants} onClose={() => setShowCreate(false)} onCreated={load} />}
      {resetTarget && <ResetModal user={resetTarget} onClose={() => setResetTarget(null)} onReset={load} />}
      {mfaResetTarget && <MfaResetModal user={mfaResetTarget} onClose={() => setMfaResetTarget(null)} onReset={load} />}
    </div>
  );
}
