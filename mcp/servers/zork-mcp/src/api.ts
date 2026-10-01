

// ---- muxB tools:
import { GAMES } from "./games.js"
import type { Game, Room } from "./engine.js"

const DIR_ORDER = ["north", "south", "east", "west", "up", "down"] as const

function pickGame(args: { gameId?: string }): Game {
  const gameId = (args.gameId ?? "").trim() || "colossal-dungeon"
  const game = GAMES[gameId]
  if (!game) throw new Error(`Unknown game "${gameId}". Available: ${Object.keys(GAMES).join(", ")}`)
  return game
}

/** What stands between the player and one declared exit, read off the room data. */
function exitNotes(game: Game, room: Room, direction: string): string {
  const notes: string[] = []
  if (room.block?.exit === direction) notes.push(`locked: ${room.block.message}`)
  if (room.needsLight === direction) notes.push("dark: needs a lit light source")
  const target = room.exits[direction as keyof typeof room.exits]
  if (target) {
    const leads = game.rooms[target]
    if (leads && !(Object.values(leads.exits) as string[]).includes(room.id)) notes.push("one way, no way back")
  }
  return notes.join("; ")
}

function itemNames(game: Game, room: Room): string {
  const items = (room.items ?? []).map((id) => {
    const item = game.items[id]
    if (!item) return id
    return item.takeable ? item.name : `${item.name} (fixed in place)`
  })
  return items.length ? items.join(", ") : "nothing"
}

export async function gameMap(args: { gameId?: string }): Promise<string> {
  const game = pickGame(args)
  const rooms = Object.values(game.rooms)
  const blocks = rooms.map((room) => {
    const exits = DIR_ORDER.filter((direction) => room.exits[direction]).map((direction) => {
      const targetId = room.exits[direction]!
      const target = game.rooms[targetId]
      const notes = exitNotes(game, room, direction)
      return `${direction} -> ${target ? target.name : targetId}${notes ? ` [${notes}]` : ""}`
    })
    const flags: string[] = []
    if (room.dark) flags.push("dark")
    if (room.block) flags.push(`guarded: ${room.block.exit}`)
    if (room.needsLight) flags.push(`needs light: ${room.needsLight}`)
    return [
      `[${room.name}]${flags.length ? ` (${flags.join(", ")})` : ""}${room.id === game.startRoom ? " <- start" : ""}`,
      `   objects: ${itemNames(game, room)}`,
      `   exits: ${exits.length ? exits.join(" | ") : "none, dead end"}`,
    ].join("\n")
  })
  const treasures = game.treasures.map((id) => game.items[id]?.name ?? id)
  return [
    `${game.name} (${game.id}): ${rooms.length} rooms, ${Object.keys(game.items).length} objects, ${treasures.length} treasures worth one point each`,
    `treasures: ${treasures.join(", ") || "none"}`,
    "",
    ...blocks,
  ].join("\n")
}

export async function gameRoutes(args: { gameId?: string; from?: string; maxRooms?: number }): Promise<string> {
  const game = pickGame(args)
  const from = (args.from ?? "").trim() || game.startRoom
  if (!game.rooms[from]) {
    throw new Error(`Unknown room "${from}". Rooms in ${game.id}: ${Object.keys(game.rooms).join(", ")}`)
  }
  const cap = Math.min(Math.max(Math.trunc(Number(args.maxRooms ?? 30)), 1), 200)

  // Breadth-first over the declared exits. Locked and unlit exits are walked
  // through but flagged, because a flag or an item is what usually opens them.
  const paths = new Map<string, string[]>([[from, []]])
  const queue: string[] = [from]
  while (queue.length) {
    const roomId = queue.shift()!
    const room = game.rooms[roomId]
    const trail = paths.get(roomId)!
    for (const direction of DIR_ORDER) {
      const next = room.exits[direction]
      if (!next || !game.rooms[next] || paths.has(next)) continue
      paths.set(next, [...trail, `${direction} to ${game.rooms[next].name}`])
      queue.push(next)
    }
  }

  const roomIds = Object.keys(game.rooms)
  const unreachable = roomIds.filter((id) => !paths.has(id))
  const rows = roomIds.slice(0, cap).map((id) => {
    const room = game.rooms[id]
    const trail = paths.get(id)
    const notes: string[] = []
    if (room.dark) notes.push("dark, needs a light source")
    if (room.block) notes.push(`guarded: ${room.block.exit}`)
    if (room.needsLight) notes.push(`needs light to leave ${room.needsLight}`)
    if (!trail) return `   ${room.name}: no route from ${game.rooms[from].name}`
    return `   ${room.name}: ${trail.length} move${trail.length === 1 ? "" : "s"}${trail.length ? ` via ${trail.join(", then ")}` : " (you start here)"}${notes.length ? ` [${notes.join("; ")}]` : ""}`
  })

  const treasurePlaces = game.treasures.map((id) => {
    const where = Object.values(game.rooms).find((room) => room.items?.includes(id))
    return `${game.items[id]?.name ?? id} in ${where ? where.name : "no room"}`
  })

  return [
    `routes in ${game.name} (${game.id}) from ${game.rooms[from].name}, following the declared exits`,
    `${paths.size} of ${roomIds.length} rooms reachable${unreachable.length ? `, unreachable: ${unreachable.join(", ")}` : ""}`,
    `treasures: ${treasurePlaces.join(" | ") || "none"}`,
    "",
    ...rows,
    ...(roomIds.length > cap ? [`   ... ${roomIds.length - cap} more rooms not shown`] : []),
  ].join("\n")
}
