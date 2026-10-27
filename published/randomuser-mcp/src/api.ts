
export interface m0_UsersArgs {
  count?: number;
}

const m0 = (() => {
const BASE = 'https://randomuser.me/api/';

async function users(args: m0_UsersArgs = {}): Promise<string> {
  const count = Math.max(1, Math.min(args.count ?? 5, 20));
  const res = await fetch(`${BASE}?results=${count}`, {
    headers: { 'User-Agent': 'mrfentmen-randomuser-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Random User returned ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      name?: { first?: string; last?: string };
      email?: string;
      location?: { city?: string; country?: string };
      picture?: { large?: string };
    }>;
  };
  const results = data.results ?? [];
  if (!results.length) return 'No users returned.';
  return `Random users (${results.length}):\n` +
    results
      .map((u, i) => `${i + 1}. ${u.name?.first ?? ''} ${u.name?.last ?? ''} | ${u.email ?? ''} | ${u.location?.city ?? ''}, ${u.location?.country ?? ''}${u.picture?.large ? `\n   ${u.picture.large}` : ''}`)
      .join('\n');
}

return { users };
})();

const m1 = (() => {
const UA = "mrfentmen-random-user-mcp/1.0 (https://github.com/mrfentmen)"
const BASE = "https://randomuser.me/api"

class RandomUserError extends Error {}

async function get(count: number, gender: string, nat: string, seed: string): Promise<any> {
  const params = new URLSearchParams({ results: String(count) })
  if (gender && (gender === "male" || gender === "female")) params.set("gender", gender)
  if (nat) params.set("nat", nat)
  if (seed) params.set("seed", seed)
  const res = await fetch(`${BASE}/?${params.toString()}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new RandomUserError(`RandomUser returned HTTP ${res.status}`)
  const d = (await res.json()) as { results: any[] }
  return d.results ?? []
}

function formatUser(u: any, i: number): string {
  const name = `${u.name?.first ?? ""} ${u.name?.last ?? ""}`.trim()
  return [
    `${i + 1}. ${name}`,
    `   ${u.gender ?? "n/a"} | ${u.dob?.age ?? "n/a"} years old | ${u.nat ?? "n/a"}`,
    `   Email: ${u.email ?? "n/a"}`,
    `   Location: ${u.location?.city ?? "n/a"}, ${u.location?.country ?? "n/a"}`,
    `   Phone: ${u.phone ?? "n/a"}`,
  ].join("\n")
}

async function generate(args: { count?: number; gender?: string; nat?: string }): Promise<string> {
  const count = Math.min(args.count ?? 1, 20)
  const users = await get(count, (args.gender ?? "").trim(), (args.nat ?? "").trim(), "")
  if (!users.length) throw new RandomUserError("No profiles generated")
  return users.map((u: any, i: number) => formatUser(u, i)).join("\n")
}

async function seed(args: { seed?: string; count?: number }): Promise<string> {
  const seed = (args.seed ?? "").trim()
  if (!seed) throw new RandomUserError("Provide a seed value")
  const count = Math.min(args.count ?? 1, 20)
  const users = await get(count, "", "", seed)
  if (!users.length) throw new RandomUserError("No profiles generated")
  return users.map((u: any, i: number) => formatUser(u, i)).join("\n")
}

return { RandomUserError, generate, seed };
})();

export const RandomUserError = m1.RandomUserError;
export const generate = m1.generate;
export const seed = m1.seed;
export const users = m0.users;
export const m0_users = m0.users;
export const m1_generate = m1.generate;
export const m1_RandomUserError = m1.RandomUserError;
export const m1_seed = m1.seed;

// ---- muxC tools:

// randomuser.me's own field names, so an invalid one fails loudly rather than
// silently returning a profile with nothing in it.

