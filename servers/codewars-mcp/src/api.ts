/**
 * Codewars API v1 client, keyless.
 * Docs: https://dev.codewars.com/
 */
const BASE = "https://www.codewars.com/api/v1"

export class CodewarsError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "codewars-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new CodewarsError("Not found on Codewars.")
  if (!res.ok) throw new CodewarsError(`Codewars error ${res.status}`)
  return (await res.json()) as T
}

export interface Codewarrior {
  username: string
  honor?: number
  clan?: string
  leaderboard?: number
  overall?: string
  totalCompleted?: number
  languages: string[]
}

export async function getUser(username: string): Promise<Codewarrior> {
  if (!/^[\w-]+$/.test(username.trim())) throw new CodewarsError(`Not a username: "${username}".`)
  const u = await getJson<Raw>(`/users/${encodeURIComponent(username.trim())}`)
  const ranks = (u.ranks ?? {}) as Raw
  const overall = (ranks.overall ?? {}) as Raw
  const langs = (ranks.languages ?? {}) as Raw
  const completed = (u.codeChallenges ?? {}) as Raw
  return {
    username: String(u.username ?? username),
    honor: u.honor,
    clan: u.clan && u.clan !== "None" ? String(u.clan) : undefined,
    leaderboard: u.leaderboardPosition,
    overall: overall.name,
    totalCompleted: completed.totalCompleted,
    languages: Object.entries(langs)
      .map(([lang, r]) => `${lang}(${(r as Raw).name ?? "?"})`)
      .slice(0, 8),
  }
}

export interface Kata {
  id?: string
  name?: string
  rank?: string
  tags: string[]
}

export async function getKata(idOrSlug: string): Promise<Kata> {
  if (!/^[\w-]+$/.test(idOrSlug.trim())) throw new CodewarsError(`Not a kata id or slug: "${idOrSlug}".`)
  const k = await getJson<Raw>(`/code-challenges/${encodeURIComponent(idOrSlug.trim().toLowerCase())}`)
  return {
    id: k.id ?? k.slug,
    name: k.name,
    rank: (k.rank as Raw)?.name ?? k.rank,
    tags: Array.isArray(k.tags) ? k.tags.map(String).slice(0, 6) : [],
  }
}

export function formatUser(u: Codewarrior): string {
  const lines = [
    `${u.username}${u.overall ? ` (${u.overall})` : ""}`,
    u.honor !== undefined ? `Honor: ${u.honor.toLocaleString()}` : "",
    u.leaderboard ? `Leaderboard: #${u.leaderboard}` : "",
    u.clan ? `Clan: ${u.clan}` : "",
    u.totalCompleted !== undefined ? `Completed kata: ${u.totalCompleted}` : "",
    u.languages.length ? `Languages: ${u.languages.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatKata(k: Kata): string {
  return `[${k.id ?? "?"}] ${k.name ?? "(unnamed)"}${k.rank ? ` (${k.rank})` : ""}${k.tags.length ? `\nTags: ${k.tags.join(", ")}` : ""}`
}

// ---- gap2a tools:

export interface CompletedArgs {
  username: string;
  page?: number;
  limit?: number;
}

export interface ProgressArgs {
  username: string;
  limit?: number;
}

export interface LanguageFilterArgs {
  filter?: string;
  limit?: number;
}

interface CompletedResponse {
  totalPages?: number;
  totalItems?: number;
  data?: Array<{ id?: string; name?: string; slug?: string; completedLanguages?: string[]; completedAt?: string }>;
}

/** Checked the same way the existing tools check a username. */
function username(value: string): string {
  const name = (value ?? "").trim();
  if (!/^[\w-]+$/.test(name)) throw new CodewarsError(`Not a username: "${value}".`);
  return name;
}

/** One page of a user's completed kata, most recent first. */
async function completedPage(name: string, page: number): Promise<CompletedResponse> {
  const suffix = page > 1 ? `?page=${page}` : "";
  return getJson<CompletedResponse>(`/users/${encodeURIComponent(name)}/code-challenges/completed${suffix}`);
}

export async function completedKata(args: CompletedArgs): Promise<string> {
  const name = username(args.username);
  const page = Math.max(1, Math.min(Math.round(args.page ?? 1), 50));
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 50));
  const d = await completedPage(name, page);
  const rows = d.data ?? [];
  if (!rows.length) return `${name} has no completed kata.`;
  const shown = rows.slice(0, limit);
  return [
    `Completed kata for ${name}: ${d.totalItems ?? rows.length} in total over ${d.totalPages ?? 1} page(s), page ${page}${rows.length > shown.length ? `, first ${shown.length} listed` : ""}.`,
    ...shown.map((r, i) => {
      const when = (r.completedAt ?? "").slice(0, 10);
      const langs = r.completedLanguages ?? [];
      return `${i + 1}. ${r.name ?? "unnamed"} [${r.slug ?? "?"}]${when ? ` - ${when}` : ""}${langs.length ? ` (${langs.join(", ")})` : ""}`;
    }),
  ].join("\n");
}

export async function supportedLanguages(args: LanguageFilterArgs): Promise<string> {
  const filter = (args.filter ?? "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 25), 58));
  const d = await getJson<{ data?: Array<{ id?: string; name?: string }> }>("/languages");
  const rows = d.data ?? [];
  if (!rows.length) return "Codewars reported no languages.";
  const matched = filter
    ? rows.filter((r) => `${r.name ?? ""} ${r.id ?? ""}`.toLowerCase().includes(filter))
    : rows;
  if (!matched.length) return `No Codewars language matches "${filter}".`;
  const shown = matched.slice(0, limit);
  return [
    `${matched.length} of the ${rows.length} languages Codewars supports${filter ? ` match "${filter}"` : ""}${matched.length > shown.length ? `, first ${shown.length} shown` : ""}:`,
    ...shown.map((r, i) => `${i + 1}. ${r.name ?? "?"} (id ${r.id ?? "?"})`),
  ].join("\n");
}
