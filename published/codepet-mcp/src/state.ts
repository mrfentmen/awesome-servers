import { access, chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { homedir } from "node:os"

export type PetState = {
  name: string
  level: number
  xp: number
  hunger: number
  happiness: number
  energy: number
  streak: number
  fedLines: number
  fedCount: number
  languages: string[]
  favoriteLang: string | null
  achievements: string[]
  ideEvents: number
  history: Array<{ at: string; kind: string; language?: string; lines?: number; status?: string }>
}

const defaultPath = join(homedir(), ".codepet", "state.json")
export const statePath = process.env.CODEPET_STATE_FILE || defaultPath
const initial: PetState = { name: "CodePet", level: 1, xp: 0, hunger: 75, happiness: 60, energy: 70, streak: 0, fedLines: 0, fedCount: 0, languages: [], favoriteLang: null, achievements: ["hatch"], ideEvents: 0, history: [] }

function normalize(input: unknown): PetState {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const num = (key: string, fallback: number, lo = 0, hi = Number.MAX_SAFE_INTEGER) => { const value = Number(raw[key]); return Number.isFinite(value) ? Math.max(lo, Math.min(hi, value)) : fallback }
  const strings = (key: string, fallback: string[], max: number) => Array.isArray(raw[key]) ? raw[key].filter((value): value is string => typeof value === "string").slice(0, max) : fallback
  return {
    ...initial,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 24) : initial.name,
    level: Math.max(1, Math.floor(num("level", 1))), xp: num("xp", 0), hunger: num("hunger", 75, 0, 100), happiness: num("happiness", 60, 0, 100), energy: num("energy", 70, 0, 100), streak: Math.floor(num("streak", 0)), fedLines: Math.floor(num("fedLines", 0)), fedCount: Math.floor(num("fedCount", 0)), ideEvents: Math.floor(num("ideEvents", 0)),
    languages: strings("languages", [], 50), achievements: strings("achievements", ["hatch"], 100), history: Array.isArray(raw.history) ? raw.history.filter((value) => value && typeof value === "object").slice(-20) as PetState["history"] : [], favoriteLang: typeof raw.favoriteLang === "string" ? raw.favoriteLang.slice(0, 40) : null,
  }
}
export async function load(): Promise<PetState> {
  try {
    await access(statePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return normalize(initial)
    throw new Error(`Cannot access CodePet state file: ${String(error)}`)
  }
  let parsed: unknown
  try { parsed = JSON.parse(await readFile(statePath, "utf8")) } catch (error) { throw new Error(`Cannot parse CodePet state file: ${String(error)}`) }
  return normalize(parsed)
}
export async function save(state: PetState): Promise<void> { await mkdir(dirname(statePath), { recursive: true }); const temp = `${statePath}.tmp`; await writeFile(temp, JSON.stringify(normalize(state), null, 2) + "\n", { encoding: "utf8", mode: 0o600 }); await chmod(temp, 0o600); await rename(temp, statePath); await chmod(statePath, 0o600) }
export function safeEvent(input: { language?: string; lines?: number; status?: string; tests?: number; files?: number }) {
  const statuses = new Set(["edited", "tests_passed", "tests_failed", "lint_clean", "lint_failed", "committed", "debugging"])
  const status = typeof input.status === "string" && statuses.has(input.status) ? input.status : "edited"
  return { language: typeof input.language === "string" ? input.language.slice(0, 40) : "unknown", lines: Math.max(0, Math.min(500, Number(input.lines) || 0)), status, tests: Math.max(0, Math.min(100, Number(input.tests) || 0)), files: Math.max(0, Math.min(100, Number(input.files) || 0)) }
}
export function eventText(state: PetState, event: ReturnType<typeof safeEvent>): string { return `${state.name} noticed ${event.status} activity in ${event.language}: ${event.lines} lines, ${event.tests} tests, ${event.files} files.` }
