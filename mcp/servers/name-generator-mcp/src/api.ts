import { randomInt } from "node:crypto"

const FIRST = ["Ada", "Alan", "Grace", "Linus", "Margaret", "Ken", "Dennis", "Barbara", "Donald", "Edsger", "Anita", "Nikola", "Marie", "Alan", "Grace", "Katherine", "Radia", "Hedy", "Claude", "Vint"]
const LAST = ["Lovelace", "Turing", "Hopper", "Torvalds", "Hamilton", "Thompson", "Ritchie", "Liskov", "Knuth", "Dijkstra", "Borg", "Tesla", "Curie", "Kay", "Johnson", "Perlman", "Lamarr", "Shannon", "Cerf", "BernersLee"]
const ADJ = ["Swift", "Cosmic", "Quantum", "Electric", "Midnight", "Solar", "Crimson", "Neon", "Lunar", "Turbo", "Silent", "Rapid", "Vivid", "Brave", "Clever", "Mighty"]
const NOUN = ["Falcon", "Comet", "Panther", "Pioneer", "Anchor", "Signal", "Engine", "River", "Summit", "Circuit", "Pulse", "Lattice", "Breeze", "Harbor", "Glacier", "Ember"]

export async function randomName(args: { count?: number }): Promise<string> {
  const n = Math.min(Math.max(args.count ?? 5, 1), 30)
  return Array.from({ length: n }, () => `${FIRST[randomInt(FIRST.length)]} ${LAST[randomInt(LAST.length)]}`).join("\n")
}

export async function username(args: { count?: number }): Promise<string> {
  const n = Math.min(Math.max(args.count ?? 5, 1), 30)
  return Array.from({ length: n }, () => {
    const base = `${FIRST[randomInt(FIRST.length)].toLowerCase()}${LAST[randomInt(LAST.length)].toLowerCase()}`
    const suffix = randomInt(10) > 6 ? String(randomInt(1000)) : ""
    return `${base}${suffix}`
  }).join("\n")
}

export async function codename(args: { count?: number }): Promise<string> {
  const n = Math.min(Math.max(args.count ?? 5, 1), 30)
  return Array.from({ length: n }, () => `Project ${ADJ[randomInt(ADJ.length)]} ${NOUN[randomInt(NOUN.length)]}`).join("\n")
}

// ---- muxB tools:

type RdapDomain = {
  ldhName?: string
  handle?: string
  status?: string[]
  events?: { eventAction?: string; eventDate?: string }[]
  entities?: { roles?: string[]; vcardArray?: [unknown, unknown[][]]; handle?: string }[]

  nameservers?: { ldhName?: string }[]
}

type DatamuseWord = { word?: string; score?: number; tags?: string[]; defs?: string[] }

type RdapEntity = { roles?: string[]; vcardArray?: [unknown, unknown[][]]; handle?: string }

