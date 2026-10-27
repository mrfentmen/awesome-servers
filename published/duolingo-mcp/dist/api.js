/**
 * Duolingo public profile API client, keyless (unofficial endpoints).
 * Only public profile data is read; nothing authenticated.
 */
const BASE = "https://www.duolingo.com/2017-06-30";
export class DuolingoError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new DuolingoError("No such Duolingo user (profiles must be public).");
    if (!res.ok)
        throw new DuolingoError(`Duolingo error ${res.status}`);
    return (await res.json());
}
export async function getProfile(username) {
    if (!/^[\w.-]+$/.test(username.trim()))
        throw new DuolingoError(`Not a username: "${username}".`);
    const data = await getJson(`/users?username=${encodeURIComponent(username.trim())}`);
    const users = Array.isArray(data.users) ? data.users : [];
    const u = users[0];
    if (!u)
        throw new DuolingoError(`No Duolingo user "${username}".`);
    const courses = Array.isArray(u.courses) ? u.courses : [];
    const ach = Array.isArray(u.achievements) ? u.achievements : [];
    return {
        username: String(u.username ?? username),
        streak: u.streak,
        totalXp: u.totalXp,
        courses: courses.map((c) => `${c.learningLanguage ?? "?"}←${c.fromLanguage ?? "?"} (xp ${c.xp ?? 0})`).slice(0, 8),
        achievements: ach.map((a) => String(a.name ?? a.title ?? "?")).slice(0, 8),
    };
}
export function formatProfile(p) {
    const lines = [
        `${p.username}`,
        p.streak !== undefined ? `Streak: ${p.streak} days` : "",
        p.totalXp !== undefined ? `Total XP: ${p.totalXp.toLocaleString()}` : "",
        p.courses.length ? `Courses:\n- ${p.courses.join("\n- ")}` : "",
        p.achievements.length ? `Achievements: ${p.achievements.join(", ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- gap4a1 tools:
