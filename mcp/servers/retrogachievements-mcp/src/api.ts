/**
 * RetroAchievements API client. Needs RA_USERNAME + RA_API_KEY
 * (free at https://retroachievements.org/settings, "API key" section).
 * Docs: https://api-docs.retroachievements.org/
 */
const BASE = "https://retroachievements.org/API"

export class RaError extends Error {}

function auth(): { z: string; y: string } {
  const user = process.env.RA_USERNAME
  const key = process.env.RA_API_KEY
  if (!user || !key) throw new RaError("Set RA_USERNAME and RA_API_KEY first (free at retroachievements.org/settings).")
  return { z: user, y: key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const { z, y } = auth()
  const qs = new URLSearchParams({ z, y, ...extra }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "retrogachievements-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new RaError("RetroAchievements refused (401/403). Check username and key.")
  if (res.status === 404) throw new RaError("Not found.")
  if (!res.ok) throw new RaError(`RetroAchievements error ${res.status}`)
  return (await res.json()) as T
}

export async function gameExtended(gameId: string): Promise<string> {
  if (!/^\d+$/.test(gameId.trim())) {
    throw new RaError(`Game id must be numeric, got "${gameId}". Find ids via rom-mcp or hiddenpalace-mcp.`)
  }
  const data = await getJson<Raw>("/API_GetGameExtended.php", { i: gameId.trim() })
  const ach: Raw = data.Achievements ?? {}
  const list: Raw[] = Object.values(ach)
  const shown = list.slice(0, 8).map((a) => `${String(a.Title ?? "?")} (${a.Points ?? "?"}pts)`)
  return [
    `[${data.ID ?? gameId}] ${data.Title ?? "(untitled)"} (${data.ConsoleName ?? "?"})`,
    `Achievements: ${list.length}`,
    shown.length ? `Sample:\n- ${shown.join("\n- ")}` : "",
    data.ImageIcon ? `https://retroachievements.org${data.ImageIcon}` : "",
  ].filter(Boolean).join("\n")
}

export async function userProgress(username: string): Promise<string> {
  if (!username.trim()) throw new RaError("Username is empty.")
  const data = await getJson<Raw>("/API_GetUserSummary.php", { u: username.trim(), g: "10", a: "10" })
  const lines = [
    `${username.trim()}`,
    data.TotalPoints ? `Points: ${Number(data.TotalPoints).toLocaleString()} (rank #${data.Rank ?? "?"})` : "",
    data.TotalTruePoints ? `True points: ${Number(data.TotalTruePoints).toLocaleString()}` : "",
  ].filter(Boolean)
  const recent: Raw[] = Array.isArray(data.RecentlyPlayed) ? data.RecentlyPlayed : []
  if (recent.length) {
    lines.push(`Recently played:\n- ${recent.slice(0, 5).map((g) => `${String(g.Title ?? "?")} (${g.ConsoleName ?? "?"})`).join("\n- ")}`)
  }
  return lines.join("\n")
}

// ---- muxB tools:

interface RaRow {
  title: string
  console: string
  pct: number
  owned: number
  total: number
  points: number
}

function raRows(text: string): RaRow[] {
  const out: RaRow[] = []
  const bad: string[] = []
  String(text ?? "")
    .split(/\r?\n/)
    .slice(0, 300)
    .forEach((line, i) => {
      const raw = line.trim()
      if (!raw || raw.startsWith("#")) return
      const cells = raw.split("|").map((c) => c.trim())
      if (cells.length < 5) {
        bad.push(`line ${i + 1}: needs title | console | percentage | owned | total [| points]`)
        return
      }
      const pct = Number(cells[2].replace("%", ""))
      const owned = Number(cells[3])
      const total = Number(cells[4])
      const points = cells.length > 5 && cells[5] !== "" ? Number(cells[5]) : NaN
      if (!Number.isFinite(pct) || !Number.isFinite(owned) || !Number.isFinite(total) || total <= 0) {
        bad.push(`line ${i + 1}: percentage, owned and total have to be numbers and total over 0`)
        return
      }
      if (owned < 0 || owned > total) {
        bad.push(`line ${i + 1}: owned (${owned}) is outside 0-${total}`)
        return
      }
      out.push({
        title: cells[0] || "(untitled)",
        console: cells[1] || "not reported",
        pct: Math.min(Math.max(pct, 0), 100),
        owned,
        total,
        points: Number.isFinite(points) && points > 0 ? points : NaN,
      })
    })
  if (out.length === 0 && bad.length > 0) {
    throw new RaError(`Nothing usable in the list. ${bad.slice(0, 4).join("; ")}`)
  }
  return out
}

const raEarned = (r: RaRow): number => (Number.isFinite(r.points) ? r.points * (r.owned / r.total) : NaN)

export async function setScorecard(args: { games: string; set_name?: string }): Promise<string> {
  const rows = raRows(args.games ?? "")
  if (rows.length === 0) {
    return "Paste one game per line as: title | console | percentage | achievements owned | achievements total | game points."
  }
  const notes: string[] = []
  const scored = rows.filter((r) => Number.isFinite(raEarned(r)))
  if (scored.length === 0) notes.push("No line carried a game points value, so only achievement counts are scored below.")
  const totalEarned = scored.reduce((a, r) => a + raEarned(r), 0)
  const totalAvailable = scored.reduce((a, r) => a + r.points, 0)
  const left = scored.reduce((a, r) => a + (r.points - raEarned(r)), 0)
  const done = rows.filter((r) => r.owned >= r.total)
  const untouched = rows.filter((r) => r.owned === 0)
  const oneAway = rows.filter((r) => r.owned > 0 && r.total - r.owned === 1)
  const queue = scored
    .filter((r) => r.total > r.owned)
    .map((r) => {
      const remaining = r.total - r.owned
      const remainingPoints = r.points - raEarned(r)
      return { r, remaining, remainingPoints, perAchievement: remainingPoints / remaining }
    })
    .sort((a, b) => b.perAchievement - a.perAchievement)
  const out = [
    `${rows.length} game(s)${args.set_name ? ` in ${args.set_name}` : ""}, ${scored.length} with a points value.`,
    scored.length > 0
      ? `Points so far ${Math.round(totalEarned)} of ${Math.round(totalAvailable)} available (${totalAvailable > 0 ? ((totalEarned / totalAvailable) * 100).toFixed(1) : "0"}%). ${Math.round(left)} points still on the table.`
      : "Points not calculated.",
    `Completed ${done.length}, untouched ${untouched.length}, one achievement away ${oneAway.length}.`,
    "",
    "Per game (points earned is the game's points scaled by the share you have):",
    ...rows.map((r) => {
      const bits = [`${r.title} [${r.console}]`]
      if (Number.isFinite(raEarned(r))) {
        bits.push(`${Math.round(raEarned(r))}/${Math.round(r.points)} pts`)
      } else {
        bits.push("points not reported")
      }
      bits.push(`${r.owned}/${r.total} ach (${r.pct.toFixed(1)}%)`)
      return `  ${bits.join("  ")}`
    }),
  ]
  if (queue.length > 0) {
    out.push(
      "",
      "Best points per remaining achievement, i.e. what to grind first:",
      ...queue.slice(0, 12).map((q, i) => `  ${i + 1}. ${q.r.title} - ${q.remaining} left, ${Math.round(q.remainingPoints)} pts, ${q.perAchievement.toFixed(1)} pts each`),
      "",
      "Scoring assumes linear credit, which is what the site does, so partial play already counts."
    )
  }
  if (oneAway.length > 0) {
    out.push("", `One achievement from done: ${oneAway.map((r) => r.title).join(", ")}.`)
  }
  if (notes.length > 0) out.push("", ...notes.map((n) => `- ${n}`))
  return out.join("\n")
}

export async function libraryBreakdown(args: { games: string }): Promise<string> {
  const rows = raRows(args.games ?? "")
  if (rows.length === 0) {
    return "Paste one game per line as: title | console | percentage | achievements owned | achievements total | game points."
  }
  const byConsole = new Map<string, { games: number; points: number; earned: number; owned: number; total: number }>()
  const bands: Array<[string, number, number]> = [["not started", 0, 0], ["1-24%", 1, 24], ["25-49%", 25, 49], ["50-74%", 50, 74], ["75-99%", 75, 99], ["100%", 100, 100]]
  const bandCounts = bands.map(([label]) => [label, 0] as [string, number])
  for (const r of rows) {
    const c = byConsole.get(r.console) ?? { games: 0, points: 0, earned: 0, owned: 0, total: 0 }
    c.games++
    c.owned += r.owned
    c.total += r.total
    if (Number.isFinite(r.points)) {
      c.points += r.points
      c.earned += raEarned(r)
    }
    byConsole.set(r.console, c)
    const idx = bands.findIndex(([, lo, hi]) => r.pct >= lo && r.pct <= hi)
    if (idx >= 0) bandCounts[idx][1]++
  }
  const totalAchievements = rows.reduce((a, r) => a + r.total, 0)
  const totalOwned = rows.reduce((a, r) => a + r.owned, 0)
  const closest = rows
    .filter((r) => r.total - r.owned > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8)
  const densest = rows
    .filter((r) => Number.isFinite(r.points) && r.total > 0)
    .map((r) => ({ r, density: r.points / r.total }))
    .sort((a, b) => b.density - a.density)
  return [
    `${rows.length} game(s), ${totalOwned}/${totalAchievements} achievements (${totalAchievements > 0 ? ((totalOwned / totalAchievements) * 100).toFixed(1) : "0"}% of the list).`,
    "",
    "By console:",
    ...[...byConsole.entries()]
      .sort((a, b) => b[1].points - a[1].points || b[1].games - a[1].games)
      .map(([name, c]) => {
        const pct = c.total > 0 ? ((c.owned / c.total) * 100).toFixed(0) : "?"
        const pts = c.points > 0 ? `, ${Math.round(c.earned)}/${Math.round(c.points)} pts` : ""
        return `  ${name}: ${c.games} game(s)${pts}, ${c.owned}/${c.total} ach (${pct}%)`
      }),
    "",
    "Completion spread:",
    ...bandCounts.filter(([, n]) => n > 0).map(([label, n]) => `  ${label}: ${n}`),
    "",
    "Closest to finished:",
    ...(closest.length > 0
      ? closest.map((r) => `  ${r.title} [${r.console}] ${r.owned}/${r.total} (${r.pct.toFixed(1)}%), ${r.total - r.owned} left`)
      : ["  nothing left in progress"]),
    "",
    "Points per achievement, a rough difficulty signal:",
    ...(densest.length > 0
      ? densest.slice(0, 6).map((d) => `  ${d.r.title}: ${d.density.toFixed(1)} pts per achievement, ${Math.round(d.r.points)} available`)
      : ["  no game in the list carries a points value"]),
  ].join("\n")
}
