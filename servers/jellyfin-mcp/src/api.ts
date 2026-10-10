/**
 * Jellyfin REST API client. Points at any instance via JELLYFIN_URL
 * (default http://localhost:8096). Public info needs no key; user and
 * library calls need JELLYFIN_API_KEY (Dashboard > API Keys).
 * Docs: https://api.jellyfin.org/
 */
const BASE = (process.env.JELLYFIN_URL ?? "http://localhost:8096").replace(/\/+$/, "")

export class JellyfinError extends Error {}

function apiKey(): string | null {
  return process.env.JELLYFIN_API_KEY ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, authed: boolean): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": "jellyfin-mcp/1.0", Accept: "application/json" }
  if (authed) {
    const key = apiKey()
    if (!key) throw new JellyfinError("Set JELLYFIN_API_KEY first (Dashboard > API Keys on your server).")
    headers["X-Emby-Token"] = key
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new JellyfinError("Jellyfin refused the key (401/403). Check JELLYFIN_API_KEY.")
  if (res.status === 404) throw new JellyfinError("Not found.")
  if (!res.ok) throw new JellyfinError(`Jellyfin error ${res.status}`)
  return (await res.json()) as T
}

export interface ServerInfo {
  name?: string
  version?: string
  id?: string
}

export async function serverInfo(): Promise<ServerInfo> {
  const info = await getJson<Raw>("/System/Info/Public", false)
  return { name: info.ServerName, version: info.Version, id: info.Id }
}

export interface JellyUser {
  id: string
  name?: string
  admin?: boolean
  lastActive?: string
}

export async function listUsers(): Promise<JellyUser[]> {
  const rows = await getJson<Raw[]>("/Users", true)
  return rows.map((u) => ({
    id: String(u.Id),
    name: u.Name,
    admin: u.Policy?.IsAdministrator,
    lastActive: u.LastActivityDate ? String(u.LastActivityDate).slice(0, 10) : undefined,
  }))
}

export interface Library {
  id: string
  name?: string
  type?: string
}

export async function listLibraries(): Promise<Library[]> {
  const data = await getJson<Raw>("/Library/MediaFolders", true)
  const rows: Raw[] = Array.isArray(data.Items) ? data.Items : []
  return rows.map((l) => ({ id: String(l.Id), name: l.Name, type: l.CollectionType }))
}

export function formatUser(u: JellyUser, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${u.id}] ${u.name ?? "(unnamed)"}${u.admin ? " (admin)" : ""}${u.lastActive ? ` — active ${u.lastActive}` : ""}`
}

export function formatLibrary(l: Library, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${l.id}] ${l.name ?? "(unnamed)"}${l.type ? ` (${l.type})` : ""}`
}

// ---- muxE tools:
// server_info returns three fields from the public endpoint, and list_users and
// list_libraries print one line per row while discarding most of what Jellyfin
// sends. Three things an administrator of a shared server cannot currently
// answer: which accounts are dormant or unsafe, who can actually see which
// library, and whether the library configuration itself is sound. Jellyfin is
// self-hosted, JELLYFIN_URL is unset, nothing answers on 8096, and the public
// demo instance redirects every API path to its web UI, so there is no instance
// to probe from here. These three therefore make no network call and read the
// API payloads the caller already holds.
import { z } from "zod";

const User = z
  .object({
    Id: z.string().optional(),
    Name: z.string().optional(),
    ServerId: z.string().optional(),
    LastLoginDate: z.string().optional(),
    LastActivityDate: z.string().optional(),
    hasPassword: z.boolean().optional(),
    hasConfiguredPassword: z.boolean().optional(),
    LastUserActivity: z.union([z.string(), z.array(z.unknown())]).optional(),
    Policy: z
      .object({
        IsAdministrator: z.boolean().optional(),
        IsDisabled: z.boolean().optional(),
        IsHidden: z.boolean().optional(),
        EnableAllFolders: z.boolean().optional(),
        EnabledFolders: z.array(z.union([z.string(), z.object({ Id: z.string().optional() })])).optional(),
        AuthenticationProviderId: z.string().optional(),
        PasswordResetProviderId: z.string().optional(),
        EnableContentDeletion: z.boolean().optional(),
        EnableRemoteControlOfOtherUsers: z.boolean().optional(),
        EnableSharedDeviceControl: z.boolean().optional(),
        IsRestricted: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const Library = z
  .object({
    Id: z.string().optional(),
    Name: z.string().optional(),
    CollectionType: z.string().nullable().optional(),
    ItemId: z.string().optional(),
    ParentId: z.string().optional(),
    Locations: z.array(z.string()).optional(),
    RefreshStatus: z.string().optional(),
    LocationType: z.string().optional(),
  })
  .passthrough();

type UserT = z.infer<typeof User>;
type LibraryT = z.infer<typeof Library>;

// Both date fields Jellyfin sets on a user, in the order that means "most
// recently used". A user with neither is one nobody has ever signed in.
const lastSeen = (u: UserT): string | null => {
  for (const k of ["LastLoginDate", "LastActivityDate"] as const) {
    const v = u[k];
    if (typeof v === "string" && v && !Number.isNaN(Date.parse(v))) return v;
  }
  return null;
};

const daysSince = (iso: string, now: Date): number | null => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86400000);
};

const dateOnly = (iso: string): string => iso.slice(0, 10);
const idOf = (v: string | { Id?: string }): string | null => (typeof v === "string" ? v : v?.Id ?? null);

function group<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    out.set(k, [...(out.get(k) ?? []), row]);
  }
  return out;
}

const pct = (n: number, total: number): string => (total > 0 ? `${((n / total) * 100).toFixed(0)}%` : "n/a");

export interface AuditUsersArgs {
  users: UserT[];
  now?: string;
}

export function audit_users(args: AuditUsersArgs): string {
  const rows = Array.isArray(args?.users) ? args.users.filter((u) => u && typeof u === "object") : [];
  if (!rows.length) return "Pass an array of the user objects Jellyfin's /Users endpoint returns.";
  // An explicit clock can be supplied so the report is reproducible and so a
  // caller can age it deliberately; otherwise the current date is used.
  const now = args?.now && !Number.isNaN(Date.parse(args.now)) ? new Date(args.now) : new Date();
  const lines = [
    "Account hygiene across a Jellyfin server, from the /Users payload:",
    `  users: ${rows.length}, judged against ${now.toISOString().slice(0, 10)}.`,
  ];
  const admins = rows.filter((u) => u.Policy?.IsAdministrator);
  const disabled = rows.filter((u) => u.Policy?.IsDisabled);
  const hidden = rows.filter((u) => u.Policy?.IsHidden);
  const never = rows.filter((u) => lastSeen(u) === null);
  const dated = rows.map((u) => ({ u, iso: lastSeen(u) })).filter((x): x is { u: UserT; iso: string } => x.iso !== null);
  const ages = dated.map((x) => daysSince(x.iso, now)).filter((d): d is number => d !== null).sort((a, b) => b - a);
  lines.push(
    `  administrators: ${admins.length}, disabled: ${disabled.length}, hidden from the user list: ${hidden.length}.`,
  );
  lines.push(`  accounts with no login and no activity recorded at all: ${never.length}${never.length ? ` (${pct(never.length, rows.length)})` : ""}.`);
  if (ages.length) {
    lines.push(`  days since last sign-in across the ${ages.length} account(s) that have one: oldest ${ages[0]}, newest ${ages[ages.length - 1]}.`);
  }
  const dormant90 = dated.filter((x) => (daysSince(x.iso, now) ?? 0) > 90);
  const dormant365 = dated.filter((x) => (daysSince(x.iso, now) ?? 0) > 365);
  lines.push(`  dormant, no sign-in for over 90 days: ${dormant90.length}; over a year: ${dormant365.length}.`);
  if (dormant90.length) {
    lines.push("    " + dormant90.map((x) => `${x.u.Name ?? x.u.Id ?? "?"} (${dateOnly(x.iso)}, ${daysSince(x.iso, now)}d)`).join(", "));
  }
  lines.push("");
  lines.push("  worth acting on:");
  let flags = 0;
  // An administrator that has never signed in is the classic leftover: full
  // rights on a server nobody is using.
  const dormantAdmins = admins.filter((u) => lastSeen(u) === null);
  if (dormantAdmins.length) {
    flags += 1;
    lines.push(`    ${dormantAdmins.length} administrator account(s) have never signed in: ${dormantAdmins.map((u) => u.Name ?? u.Id ?? "?").join(", ")}. These hold full rights and are worth deleting if nobody needs them.`);
  }
  const oldAdmins = admins.filter((u) => (daysSince(lastSeen(u) as string, now) ?? 0) > 365);
  if (oldAdmins.length) {
    flags += 1;
    lines.push(`    ${oldAdmins.length} administrator(s) last signed in over a year ago: ${oldAdmins.map((u) => `${u.Name ?? u.Id ?? "?"} (${dateOnly(lastSeen(u) as string)})`).join(", ")}.`);
  }
  const noPassword = rows.filter((u) => u.hasPassword === true && !u.Policy?.IsDisabled);
  if (noPassword.length) {
    flags += 1;
    lines.push(`    ${noPassword.length} enabled account(s) have a local password set: ${noPassword.map((u) => u.Name ?? u.Id ?? "?").join(", ")}. A local password is a weaker guarantee than an external provider, and for a child or guest account it is usually not wanted.`);
  }
  const external = rows.filter((u) => u.Policy?.AuthenticationProviderId && !/default/i.test(u.Policy.AuthenticationProviderId));
  if (external.length) {
    flags += 1;
    lines.push(`    ${external.length} account(s) authenticate through something other than the built-in default: ${external.map((u) => `${u.Name ?? u.Id ?? "?"} via ${u.Policy?.AuthenticationProviderId}`).join(", ")}.`);
  }
  const superUsers = rows.filter((u) => u.Policy?.IsAdministrator && u.Policy?.IsHidden);
  if (superUsers.length) {
    flags += 1;
    lines.push(`    ${superUsers.length} account(s) are both administrator and hidden from the user list, which is the shape of a service account: ${superUsers.map((u) => u.Name ?? u.Id ?? "?").join(", ")}.`);
  }
  if (!flags) lines.push("    nothing here stands out: no dormant administrator, no enabled account without a decision to make about it.");
  const providers = group(rows, (u) => u.Policy?.AuthenticationProviderId ?? "none given");
  lines.push("");
  lines.push(`  authentication providers in use: ${[...providers.entries()].map(([p, list]) => `${p} (${list.length})`).join(", ")}.`);
  const dupes = new Map<string, string[]>();
  for (const u of rows) {
    const n = (u.Name ?? "").trim().toLowerCase();
    if (n) dupes.set(n, [...(dupes.get(n) ?? []), u.Id ?? "?"]);
  }
  const clash = [...dupes.entries()].filter(([, ids]) => ids.length > 1);
  if (clash.length) lines.push(`  names that appear more than once: ${clash.map(([n, ids]) => `${n} (${ids.length})`).join(", ")}, which is legal but makes a name a poor identifier.`);
  return lines.join("\n");
}

export interface AccessArgs {
  users: UserT[];
  libraries: LibraryT[];
}

export function access_audit(args: AccessArgs): string {
  const users = Array.isArray(args?.users) ? args.users.filter((u) => u && typeof u === "object") : [];
  const libs = Array.isArray(args?.libraries) ? args.libraries.filter((l) => l && typeof l === "object") : [];
  if (!users.length || !libs.length) {
    return "Pass both arrays: the user objects from /Users and the library objects from /Library/MediaFolders.";
  }
  const libId = (l: LibraryT) => l.Id ?? l.ItemId ?? "?";
  const libName = (l: LibraryT) => l.Name ?? libId(l);
  const byId = new Map(libs.map((l) => [libId(l), l]));
  const lines = [
    "Who can see which library, from the /Users policy fields and the /Library/MediaFolders list:",
    `  ${users.length} user(s) against ${libs.length} librar${libs.length === 1 ? "y" : "ies"}.`,
    `  libraries: ${libs.map((l) => `${libName(l)}${l.CollectionType ? ` (${l.CollectionType})` : " (no collection type)"}`).join(", ")}`,
  ];
  // A disabled account cannot reach anything, so it is excluded here as well
  // as in the per-library walk below; counting it as seeing everything was a
  // real contradiction on a server with a switched-off guest account.
  const everyone = users.filter((u) => u.Policy?.EnableAllFolders === true && u.Policy?.IsDisabled !== true);
  if (everyone.length) {
    lines.push(`  ${everyone.length} user(s) can see every library: ${everyone.map((u) => u.Name ?? u.Id ?? "?").join(", ")}.`);
  }
  // Administrators and EnableAllFolders are the two ways to bypass the
  // EnabledFolders list, and they are reported separately so the reader can see
  // which mechanism is doing the work.
  const admins = users.filter((u) => u.Policy?.IsAdministrator);
  if (admins.length) {
    lines.push(`  ${admins.length} administrator(s), who reach everything regardless of their folder list: ${admins.map((u) => u.Name ?? u.Id ?? "?").join(", ")}.`);
  }
  lines.push("");
  lines.push("  library by library:");
  for (const l of libs) {
    const id = libId(l);
    const viewers = users.filter((u) => {
      if (u.Policy?.IsDisabled) return false;
      if (u.Policy?.IsAdministrator) return true;
      if (u.Policy?.EnableAllFolders) return true;
      return (u.Policy?.EnabledFolders ?? []).some((f) => idOf(f) === id);
    });
    const denied = users.filter((u) => !viewers.includes(u));
    lines.push(`    ${libName(l)}${l.CollectionType ? ` (${l.CollectionType})` : ""} — ${viewers.length} of ${users.length} can see it: ${viewers.map((u) => u.Name ?? u.Id ?? "?").join(", ") || "nobody"}`);
    if (denied.length) lines.push(`      excluded: ${denied.map((u) => u.Name ?? u.Id ?? "?").join(", ")}`);
  }
  // A library id nobody references is usually a library whose folder list was
  // edited by hand, and it leaves an admin the only person who can open it.
  const referenced = new Set(users.flatMap((u) => (u.Policy?.EnabledFolders ?? []).map((f) => idOf(f)).filter((x): x is string => x !== null)));
  const orphans = libs.filter((l) => !referenced.has(libId(l)));
  lines.push("");
  if (orphans.length) {
    lines.push(`  ${orphans.length} librar${orphans.length === 1 ? "y is" : "ies are"} named in nobody's EnabledFolders: ${orphans.map((l) => libName(l)).join(", ")}. They are reachable only by an administrator or by a user with EnableAllFolders, so removing that access would hide them entirely.`);
  } else {
    lines.push("  every library is named in at least one user's EnabledFolders, so none of them depends on administrator rights to be reachable.");
  }
  const stale = users.flatMap((u) =>
    (u.Policy?.EnabledFolders ?? []).map((f) => idOf(f)).filter((x): x is string => x !== null && !byId.has(x)),
  );
  if (stale.length) {
    lines.push(`  ${[...new Set(stale)].length} library id(s) appear in a user's folder list but match no library here: ${[...new Set(stale)].join(", ")}. Those entries are dead and the user may be losing access they expected.`);
  }
  const perUser = users.map((u) => {
    if (u.Policy?.IsDisabled) return `${u.Name ?? u.Id ?? "?"}: disabled, 0/${libs.length}`;
    const n = libs.filter((l) => {
      if (u.Policy?.IsAdministrator || u.Policy?.EnableAllFolders) return true;
      return (u.Policy?.EnabledFolders ?? []).some((f) => idOf(f) === libId(l));
    }).length;
    return `${u.Name ?? u.Id ?? "?"}: ${n}/${libs.length}`;
  });
  lines.push(`  coverage per user — ${perUser.join(", ")}.`);
  return lines.join("\n");
}

export interface LibrarySummaryArgs {
  libraries: LibraryT[];
  itemCounts?: Record<string, number>;
}

export function library_summary(args: LibrarySummaryArgs): string {
  const libs = Array.isArray(args?.libraries) ? args.libraries.filter((l) => l && typeof l === "object") : [];
  if (!libs.length) return "Pass the library objects from /Library/MediaFolders, or an array of them.";
  const libId = (l: LibraryT) => l.Id ?? l.ItemId ?? "?";
  const libName = (l: LibraryT) => l.Name ?? libId(l);
  const counts = args?.itemCounts && typeof args.itemCounts === "object" ? args.itemCounts : {};
  const lines = [
    "What the library configuration adds up to, from /Library/MediaFolders:",
    `  libraries: ${libs.length}.`,
  ];
  const byType = group(libs, (l) => l.CollectionType ?? "none given");
  lines.push(`  by collection type: ${[...byType.entries()].map(([t, list]) => `${t} (${list.length})`).join(", ")}.`);
  const untyped = libs.filter((l) => !l.CollectionType);
  if (untyped.length) {
    lines.push(`  ${untyped.length} librar${untyped.length === 1 ? "y has" : "ies have"} no collection type: ${untyped.map((l) => libName(l)).join(", ")}. That makes it a plain folder rather than a typed library, which is the usual reason items added to it never appear in the expected place.`);
  }
  const mixed = libs.filter((l) => /mixed|homevideos|boxsets/i.test(l.CollectionType ?? ""));
  if (mixed.length) lines.push(`  ${mixed.length} librar${mixed.length === 1 ? "y holds" : "ies hold"} mixed or home video content rather than one media kind: ${mixed.map((l) => `${libName(l)} (${l.CollectionType})`).join(", ")}.`);
  // Duplicate names and duplicate ItemIds are both real configuration mistakes.
  const names = new Map<string, string[]>();
  for (const l of libs) {
    const n = (l.Name ?? "").trim().toLowerCase();
    if (n) names.set(n, [...(names.get(n) ?? []), libId(l)]);
  }
  const clash = [...names.entries()].filter(([, ids]) => ids.length > 1);
  const ids = new Map<string, string[]>();
  for (const l of libs) {
    const i = l.ItemId;
    if (i) ids.set(i, [...(ids.get(i) ?? []), libId(l)]);
  }
  const idClash = [...ids.entries()].filter(([, ls]) => ls.length > 1);
  lines.push("");
  lines.push("  configuration problems found:");
  let problems = 0;
  if (clash.length) {
    problems += 1;
    lines.push(`    ${clash.length} name(s) are used by more than one library: ${clash.map(([n, ls]) => `${n} (${ls.length} libraries)`).join(", ")}. Jellyfin allows it, and it makes the name useless for telling them apart.`);
  }
  if (idClash.length) {
    problems += 1;
    lines.push(`    ${idClash.length} librar${idClash.length === 1 ? "y points" : "ies point"} at the same underlying item id: ${idClash.map(([i, ls]) => `${i} used by ${ls.length}`).join(", ")}, so they are the same folder listed twice.`);
  }
  if (untyped.length) problems += 1;
  if (!problems) lines.push("    none: names are unique, item ids are unique, and every library has a collection type.");
  const scanning = libs.filter((l) => l.RefreshStatus && !/idle/i.test(l.RefreshStatus));
  if (scanning.length) {
    lines.push(`    ${scanning.length} librar${scanning.length === 1 ? "y is" : "ies are"} not idle: ${scanning.map((l) => `${libName(l)} (${l.RefreshStatus})`).join(", ")}, so a scan is still running and item counts below are incomplete.`);
  }
  const locs = libs.filter((l) => (l.Locations ?? []).length === 0);
  if (locs.length) {
    lines.push(`    ${locs.length} librar${locs.length === 1 ? "y reports" : "ies report"} no filesystem location: ${locs.map((l) => libName(l)).join(", ")}, which is what an empty or unmounted library looks like.`);
  }
  lines.push("");
  if (Object.keys(counts).length) {
    const pairs = libs
      .map((l) => ({ l, n: counts[libName(l)] ?? counts[libId(l)] ?? 0 }))
      .sort((a, b) => b.n - a.n);
    const total = pairs.reduce((acc, p) => acc + p.n, 0);
    lines.push("  item counts you supplied:");
    for (const p of pairs) lines.push(`    ${libName(p.l).padEnd(24)}${String(p.n).padStart(8)}   ${pct(p.n, total)} of ${total}`);
    lines.push(`  the largest is ${pairs[0] ? libName(pairs[0].l) : "?"}${total > 0 && pairs[0] && pairs[0].n / total > 0.8 ? ", which is more than four fifths of everything here" : ""}.`);
  } else {
    lines.push("  no item counts were supplied, so only the configuration is described. Pass itemCounts keyed by library name or id to get the size share.");
  }
  const types = [...new Set(libs.map((l) => l.LocationType).filter(Boolean))];
  if (types.length) lines.push(`  location types: ${types.join(", ")}.`);
  return lines.join("\n");
}
