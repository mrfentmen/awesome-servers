export class ClerkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ClerkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CLERK_SECRET_KEY;
  if (!k) throw new ClerkError("Set CLERK_SECRET_KEY (Clerk dashboard).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.clerk.com/v1" + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new ClerkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ClerkError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listUsers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/users?limit=${n}`);
}

export function getUser(userId: string): Promise<string> {
  return get(`/users/${encodeURIComponent(userId)}`);
}

// ---- muxD tools:

/** Clerk returns list endpoints as { data: [...], total_count }. */
async function clerkList(path: string, params: URLSearchParams = new URLSearchParams()): Promise<{ data: any[]; total: number | null }> {
  const qs = params.toString()
  const raw = await get(`${path}${qs ? `?${qs}` : ""}`);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new ClerkError(`Clerk returned a body for ${path} that is not JSON: ${raw.slice(0, 200)}`);
  }
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : null;
  if (!rows) throw new ClerkError(`Clerk returned no data array for ${path}. Body started: ${raw.slice(0, 200)}`);
  const total = Number.isFinite(Number(parsed?.total_count)) ? Number(parsed.total_count) : null;
  return { data: rows, total };
}

const clerkStamp = (seconds: unknown): string => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "?";
  return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 16) + "Z";
};

const clerkDuration = (from: unknown, to: unknown): string => {
  const a = Number(from);
  const b = Number(to);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "?";
  const secs = b - a;
  if (secs < 90) return `${secs} s`;
  if (secs < 5400) return `${Math.round(secs / 60)} min`;
  if (secs < 172800) return `${(secs / 3600).toFixed(1)} h`;
  return `${(secs / 86400).toFixed(1)} d`;
};

export interface SessionsArgs {
  user_id?: string;
  client_id?: string;
  status?: string;
  limit?: string;
}

const SESSION_STATUSES = ["active", "ended", "removed", "replaced", "revoked"];

/** Active and recent sessions for one user, a client, or the whole instance. */
export async function listSessions(args: SessionsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit ?? 20) || 20, 1), 100);
  const params = new URLSearchParams();
  if (args.user_id?.trim()) params.set("user_id", args.user_id.trim());
  if (args.client_id?.trim()) params.set("client_id", args.client_id.trim());
  const status = (args.status ?? "").trim();
  if (status) {
    if (!SESSION_STATUSES.includes(status)) throw new ClerkError(`status must be one of ${SESSION_STATUSES.join(", ")}`);
    params.set("status", status);
  }
  const scope = args.user_id?.trim() ? `user ${args.user_id.trim()}` : args.client_id?.trim() ? `client ${args.client_id.trim()}` : "the whole instance";
  const { data, total } = await clerkList("/sessions", params);
  if (!data.length) return `No sessions found for ${scope}${status ? ` with status ${status}` : ""}. Clerk prunes old inactive sessions, so an empty result here does not prove the user was never signed in.`;

  const lines = [`Sessions for ${scope} — showing ${data.length}${total !== null ? ` of ${total}` : ""}${status ? `, status ${status}` : ""}`, ""];
  for (const s of data.slice(0, limit)) {
    const activity = s?.latest_activity ?? {};
    const detail = [
      `last active ${clerkStamp(s?.last_active_at)}`,
      s?.expire_at ? `expires ${clerkStamp(s.expire_at)}` : "no expiry set",
      s?.abandon_at ? `abandons ${clerkStamp(s.abandon_at)}` : "",
      activity?.device_type ? `via ${activity.device_type}` : "",
      activity?.ip_address ? `ip ${activity.ip_address}` : "",
      s?.last_active_organization_id ? `org ${s.last_active_organization_id}` : "",
    ].filter(Boolean).join(", ");
    // For a finished session this span is its lifetime; only a live session has been idle.
    const span = clerkDuration(s?.created_at, s?.last_active_at ?? s?.updated_at);
    const live = String(s?.status) === "active";
    lines.push(`${s?.status ?? "?"} ${s?.id ?? "?"}`, `  user ${s?.user_id ?? "?"} | client ${s?.client_id ?? "?"} | created ${clerkStamp(s?.created_at)} | ${live ? `idle for ${span}` : `ran for ${span}`}`, `  ${detail}`);
  }
  if (data.length > limit) lines.push("", `...and ${data.length - limit} more; raise limit to see them.`);
  return lines.join("\n");
}

export interface InvitationsArgs {
  status?: string;
  query?: string;
  order_by?: string;
  limit?: string;
}

const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"];

/** Outstanding and historical sign-up invitations, so stale ones can be chased or revoked. */
export async function listInvitations(args: InvitationsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit ?? 20) || 20, 1), 100);
  const params = new URLSearchParams();
  const status = (args.status ?? "").trim();
  if (status) {
    if (!INVITATION_STATUSES.includes(status)) throw new ClerkError(`status must be one of ${INVITATION_STATUSES.join(", ")}`);
    params.set("status", status);
  }
  if (args.query?.trim()) params.set("query", args.query.trim());
  const orderBy = (args.order_by ?? "").trim();
  if (orderBy) {
    if (!orderBy.startsWith("-")) params.set("order_by", orderBy);
    else params.set("order_by", `-${orderBy.slice(1).replace(/^-/, "")}`);
  }
  const { data, total } = await clerkList("/invitations", params);
  if (!data.length) return `No invitations found${status ? ` with status ${status}` : ""}${args.query?.trim() ? ` matching "${args.query.trim()}"` : ""}.`;

  const byStatus = new Map<string, number>();
  for (const i of data) byStatus.set(String(i?.status ?? "unknown"), (byStatus.get(String(i?.status ?? "unknown")) ?? 0) + 1);
  const lines = [
    `Invitations — showing ${Math.min(data.length, limit)}${total !== null ? ` of ${total}` : ""}${status ? `, status ${status}` : ""}`,
    `Status mix in this page: ${[...byStatus.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
    "",
  ];
  for (const i of data.slice(0, limit)) {
    const expires = Number(i?.expires_at);
    const stale = Number.isFinite(expires) && expires > 0 && expires * 1000 < Date.now() && String(i?.status) === "pending";
    lines.push(`${i?.status ?? "?"}${i?.revoked ? " (revoked)" : ""} ${i?.email_address ?? "?"}`, `  id ${i?.id ?? "?"} | created ${clerkStamp(i?.created_at)} | expires ${i?.expires_at ? clerkStamp(expires) : "never"}${stale ? " — expired while still pending, so nobody can accept it" : ""}`);
  }
  if (data.length > limit) lines.push("", `...and ${data.length - limit} more; raise limit to see them.`);
  return lines.join("\n");
}

export interface MembershipsArgs {
  organization_id: string;
  role?: string;
  query?: string;
  last_active_at_before?: string;
  last_active_at_after?: string;
  limit?: string;
}

/** Who belongs to one organization and what they can do in it. */
export async function listMemberships(args: MembershipsArgs): Promise<string> {
  const orgId = (args.organization_id ?? "").trim();
  if (!orgId) throw new ClerkError("Provide organization_id (see list_organizations or the organization URL in the Clerk dashboard).");
  const limit = Math.min(Math.max(Number(args.limit ?? 25) || 25, 1), 100);
  const params = new URLSearchParams();
  if (args.role?.trim()) params.set("role", args.role.trim());
  if (args.query?.trim()) params.set("query", args.query.trim());
  for (const key of ["last_active_at_before", "last_active_at_after"] as const) {
    const raw = (args[key] ?? "").toString().trim();
    if (!raw) continue;
    const asNumber = Number(raw);
    const stamp = Number.isFinite(asNumber) && asNumber > 0 ? asNumber : Date.parse(raw);
    if (!Number.isFinite(stamp)) throw new ClerkError(`${key} must be a unix timestamp (seconds) or a date such as 2026-01-31.`);
    params.set(key, String(Math.floor(stamp / 1000)));
  }
  const { data, total } = await clerkList(`/organizations/${encodeURIComponent(orgId)}/memberships`, params);
  if (!data.length) return `No members matched in organization ${orgId}${args.role?.trim() ? ` with role ${args.role.trim()}` : ""}.`;

  const byRole = new Map<string, number>();
  for (const m of data) byRole.set(String(m?.role_name ?? m?.role ?? "unknown"), (byRole.get(String(m?.role_name ?? m?.role ?? "unknown")) ?? 0) + 1);
  const lines = [
    `Members of organization ${orgId} — showing ${Math.min(data.length, limit)}${total !== null ? ` of ${total}` : ""}`,
    `Roles in this page: ${[...byRole.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
    "",
  ];
  for (const m of data.slice(0, limit)) {
    const user = m?.public_user_data ?? {};
    const who = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.identifier || m?.public_user_data?.user_id || "no public profile";
    const perms = Array.isArray(m?.permissions) && m.permissions.length ? m.permissions.slice(0, 8).join(", ") : "inherits the role default";
    const org = m?.organization;
    lines.push(`${m?.role_name ?? m?.role ?? "?"} — ${who}`, `  user ${user?.user_id ?? m?.id ?? "?"} | member since ${clerkStamp(m?.created_at)} | permissions: ${perms}`, org?.name ? `  organization ${org.name} (${org.slug ?? "no slug"})` : "");
  }
  if (data.length > limit) lines.push("", `...and ${data.length - limit} more; raise limit to see them.`);
  return lines.filter((l) => l !== "").join("\n");
}
