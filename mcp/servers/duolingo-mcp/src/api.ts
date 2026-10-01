/**
 * Duolingo public profile API client, keyless (unofficial endpoints).
 * Only public profile data is read; nothing authenticated.
 */
const BASE = "https://www.duolingo.com/2017-06-30"

export class DuolingoError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new DuolingoError("No such Duolingo user (profiles must be public).")
  if (!res.ok) throw new DuolingoError(`Duolingo error ${res.status}`)
  return (await res.json()) as T
}

export interface DuoProfile {
  username: string
  streak?: number
  totalXp?: number
  courses: string[]
  achievements: string[]
}

export async function getProfile(username: string): Promise<DuoProfile> {
  if (!/^[\w.-]+$/.test(username.trim())) throw new DuolingoError(`Not a username: "${username}".`)
  const data = await getJson<Raw>(`/users?username=${encodeURIComponent(username.trim())}`)
  const users: Raw[] = Array.isArray(data.users) ? data.users : []
  const u = users[0]
  if (!u) throw new DuolingoError(`No Duolingo user "${username}".`)
  const courses: Raw[] = Array.isArray(u.courses) ? u.courses : []
  const ach: Raw[] = Array.isArray(u.achievements) ? u.achievements : []
  return {
    username: String(u.username ?? username),
    streak: u.streak,
    totalXp: u.totalXp,
    courses: courses.map((c) => `${c.learningLanguage ?? "?"}←${c.fromLanguage ?? "?"} (xp ${c.xp ?? 0})`).slice(0, 8),
    achievements: ach.map((a) => String(a.name ?? a.title ?? "?")).slice(0, 8),
  }
}

export function formatProfile(p: DuoProfile): string {
  const lines = [
    `${p.username}`,
    p.streak !== undefined ? `Streak: ${p.streak} days` : "",
    p.totalXp !== undefined ? `Total XP: ${p.totalXp.toLocaleString()}` : "",
    p.courses.length ? `Courses:\n- ${p.courses.join("\n- ")}` : "",
    p.achievements.length ? `Achievements: ${p.achievements.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxB tools:

export interface ProfileDetailsArgs {
  username: string;
}

const duoStamp = (seconds: unknown): string => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "not reported";
  return `${new Date(n * 1000).toISOString().slice(0, 10)} (unix ${n})`;
};

export async function profileDetails(args: ProfileDetailsArgs): Promise<string> {
  const username = (args.username ?? "").trim();
  if (!/^[\w.-]+$/.test(username)) throw new DuolingoError(`Not a username: "${args.username}".`);
  const data = await getJson<Raw>(`/users?username=${encodeURIComponent(username)}`);
  const users: Raw[] = Array.isArray(data.users) ? data.users : [];
  const u = users[0];
  if (!u) throw new DuolingoError(`No Duolingo user "${username}".`);
  const streakData = (u.streakData ?? {}) as Raw;
  const ambassador = (u.globalAmbassadorStatus ?? {}) as Raw;
  const privacy: string[] = Array.isArray(u.privacySettings) ? u.privacySettings : [];
  const current = (Array.isArray(u.courses) ? u.courses : []).find(
    (c: Raw) => c?.id != null && c.id === u.currentCourseId,
  );
  return [
    `${u.username ?? username}`,
    `Display name: ${u.name != null && String(u.name).trim() ? String(u.name) : "not reported"}`,
    `Bio: ${u.bio != null && String(u.bio).trim() ? String(u.bio) : "not reported"}`,
    `Profile picture: ${u.picture != null && String(u.picture).trim() ? String(u.picture) : "not reported"}`,
    `Joined Duolingo: ${duoStamp(u.creationDate)}`,
    `Email verified: ${u.emailVerified === true ? "yes" : u.emailVerified === false ? "no" : "not reported"}`,
    `Duolingo Plus: ${u.hasPlus === true ? "yes" : u.hasPlus === false ? "no" : "not reported"}`,
    `Current streak: ${streakData.currentStreak ?? "not reported"}`,
    `Current course: ${u.currentCourseId != null ? String(u.currentCourseId) : "not reported"}${current?.title ? ` (${current.title})` : ""}`,
    `Interface language: ${u.learningLanguage != null ? String(u.learningLanguage) : "not reported"} | base language: ${u.fromLanguage != null ? String(u.fromLanguage) : "not reported"}`,
    `Motivation: ${u.motivation != null && String(u.motivation) !== "none" ? String(u.motivation) : "not reported"}`,
    `Global ambassador status: ${Object.keys(ambassador).length ? JSON.stringify(ambassador).slice(0, 120) : "not reported"}`,
    `Roles: ${Array.isArray(u.roles) && u.roles.length ? u.roles.map(String).join(", ") : "not reported"}`,
    `Privacy settings: ${privacy.length ? `${privacy.length} flags, all public flags are off for the fields above` : "not reported"}`,
  ].join("\n");
}
