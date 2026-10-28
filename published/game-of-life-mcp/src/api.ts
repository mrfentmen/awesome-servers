/**
 * Game of Life — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Game of Life"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "game-of-life-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function parse(grid: string[]): { cells: number[][]; w: number; h: number } {
  const w = Math.max(...grid.map((r) => r.length))
  if (grid.some((r) => r.length !== w)) throw new SourceError("all grid rows must have the same length")
  const cells = grid.map((r) => r.split("").map((ch) => (ch === "#" || ch === "1" || ch === "O" ? 1 : 0)))
  if (!cells.length || !w) throw new SourceError("grid is empty")
  if (cells.length * w > 100000) throw new SourceError("grid is too large (max 100k cells)")
  return { cells, w, h: cells.length }
}

function step(cells: number[][], w: number, h: number, wrap: boolean): number[][] {
  const out = Array.from({ length: h }, () => Array(w).fill(0))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          let nx = x + dx, ny = y + dy
          if (wrap) { nx = (nx + w) % w; ny = (ny + h) % h }
          else if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          n += cells[ny][nx]
        }
      }
      out[y][x] = cells[y][x] ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
    }
  }
  return out
}

const render = (cells: number[][]): string[] => cells.map((r) => r.map((v) => (v ? "#" : ".")).join(""))
const key = (cells: number[][]): string => cells.map((r) => r.join("")).join("/")

export async function evolveLife(a: { grid: string[]; generations: number; wrap: boolean }): Promise<string> {
  let { cells, w, h } = parse(a.grid)
  const start = key(cells)
  for (let i = 0; i < a.generations; i++) cells = step(cells, w, h, a.wrap)
  const alive = cells.flat().reduce((t, v) => t + v, 0)
  return [
    `Generation ${a.generations} (${a.wrap ? "wrapped" : "bounded"}):`,
    "```",
    ...render(cells),
    "```",
    `Alive: ${alive} (started ${start.split("").filter((c) => c === "1").length})`,
  ].join("\n")
}

export async function lifeStats(a: { grid: string[] }): Promise<string> {
  const { cells, w, h } = parse(a.grid)
  let alive = 0, minX = w, maxX = -1, minY = h, maxY = -1
  cells.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return
    alive++
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }))
  return [
    `Grid: ${w}x${h}`,
    `Alive: ${alive} / ${w * h} (${((alive / (w * h)) * 100).toFixed(1)}%)`,
    alive ? `Bounding box: ${maxX - minX + 1}x${maxY - minY + 1} at (${minX},${minY})` : "Bounding box: empty",
  ].join("\n")
}

export async function detectLifeCycle(a: { grid: string[]; maxGenerations: number }): Promise<string> {
  const parsed = parse(a.grid)
  let cells = parsed.cells
  const seen = new Map<string, number>()
  for (let g = 0; g <= a.maxGenerations; g++) {
    const k = key(cells)
    if (seen.has(k)) {
      const first = seen.get(k)!
      const period = g - first
      return period === 1 ? `Still life: stable after ${first} generations.` : `Cycle: period ${period}, repeating from generation ${first}.`
    }
    seen.set(k, g)
    if (cells.flat().every((v) => v === 0)) return `Extinct after ${g} generations.`
    cells = step(cells, parsed.w, parsed.h, false)
  }
  return `No cycle or extinction within ${a.maxGenerations} generations.`
}
