/**
 * A compact interactive-fiction (text adventure) engine.
 *
 * Rooms, takeable items, locked exits, dark rooms, and per-item use
 * effects are declared as plain data in games.ts. The engine handles
 * natural-language-ish command parsing, player state, and scoring.
 * It is deliberately tiny (no Z-machine) but supports real gameplay:
 * moving, inventory, combat-light puzzles, lighting, and unlocking.
 */

export type Direction = "north" | "south" | "east" | "west" | "up" | "down"

export interface GameState {
  roomId: string
  inventory: string[]
  flags: Record<string, boolean>
  lights: string[] // item ids that currently emit light
  moves: number
  score: number
  maxScore: number
  won: boolean
}

export interface GameItem {
  id: string
  name: string
  aliases: string[]
  takeable: boolean
  description: string
  /** Called when the player "use <item>" (optionally "use <item> on <target>"). */
  use?: (state: GameState, target?: string) => string
}

export interface Room {
  id: string
  name: string
  description: string
  exits: Partial<Record<Direction, string>>
  dark?: boolean
  items?: string[]
  /** Exit blocked until `flag` is set — e.g. a troll guarding it. */
  block?: { exit: Direction; flag: string; message: string }
  /** Exit requiring a lit light source. */
  needsLight?: Direction
  /** Optional room-specific text hooks. */
  onLook?: (state: GameState) => string
}

export interface Game {
  id: string
  name: string
  intro: string
  startRoom: string
  winMessage: string
  rooms: Record<string, Room>
  items: Record<string, GameItem>
  hints: Record<string, string> // roomId -> hint
  /** Item ids worth 1 point each; game won when all are collected. */
  treasures: string[]
}

// ---------------------------------------------------------------------------
// Command parsing
// ---------------------------------------------------------------------------

const DIR_MAP: Record<string, Direction> = {
  n: "north",
  north: "north",
  s: "south",
  south: "south",
  e: "east",
  east: "east",
  w: "west",
  west: "west",
  u: "up",
  up: "up",
  d: "down",
  down: "down",
}

const LOOK_VERBS = new Set(["look", "l", "examine", "inspect", "check", "x", "search", "scan"])
const GO_VERBS = new Set(["go", "move", "walk", "run", "head", "travel", "enter", "climb"])
const TAKE_VERBS = new Set(["take", "grab", "get", "pick", "steal", "loot", "collect"])
const DROP_VERBS = new Set(["drop", "put", "discard", "leave"])
const INVENTORY_VERBS = new Set(["inventory", "inv", "i", "items", "bag", "pockets"])
const USE_VERBS = new Set(["use", "light", "unlock", "open", "eat", "drink", "read", "throw", "attack", "hit", "kill", "fight", "swing"])
const HELP_VERBS = new Set(["help", "h", "commands", "?"])
const SCORE_VERBS = new Set(["score", "points", "status"])
const RESTART_VERBS = new Set(["restart", "reset", "quit", "q"])

function tokenize(cmd: string): string[] {
  return cmd
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

const ARTICLES = new Set(["the", "a", "an", "some", "that", "this", "up", "down"])

/** Join words into a noun phrase, dropping filler articles. */
function nounPhrase(words: string[]): string {
  return words.filter((w) => !ARTICLES.has(w)).join(" ")
}

/** Find an item by alias across the game's item table. */
function findItem(game: Game, noun: string): GameItem | undefined {
  const q = noun.replace(/\s+/g, " ").trim()
  for (const item of Object.values(game.items)) {
    if (
      item.id === q ||
      item.name.toLowerCase() === q ||
      item.aliases.some((a) => a === q)
    ) {
      return item
    }
  }
  return undefined
}

function resolveDirection(tokens: string[]): Direction | undefined {
  for (const t of tokens) {
    if (DIR_MAP[t]) return DIR_MAP[t]
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class Adventure {
  game: Game
  state: GameState

  constructor(game: Game) {
    this.game = game
    this.state = freshState(game)
  }

  start(): string {
    this.state = freshState(this.game)
    return (
      `${this.game.name}\n\n${this.game.intro}\n\n` +
      this.roomDescription(this.state.roomId) +
      "\n(Type 'help' to see commands.)"
    )
  }

  /** Execute a natural-language command, returning the game's response. */
  act(command: string): string {
    const tokens = tokenize(command)
    if (tokens.length === 0) return "Huh?"

    const first = tokens[0]
    const rest = tokens.slice(1)

    if (LOOK_VERBS.has(first)) return this.doLook(rest)
    if (GO_VERBS.has(first)) {
      const dir = resolveDirection(rest) ?? resolveDirection(tokens)
      if (dir) return this.doMove(dir)
      if (rest.length) return this.doLook([rest.join(" ")])
      return "Go where?"
    }
    if (TAKE_VERBS.has(first)) return this.doTake(rest)
    if (DROP_VERBS.has(first)) return this.doDrop(rest)
    if (INVENTORY_VERBS.has(first)) return this.doInventory()
    if (USE_VERBS.has(first)) return this.doUse(rest)
    if (HELP_VERBS.has(first)) return this.doHelp()
    if (SCORE_VERBS.has(first)) return this.doScore()
    if (RESTART_VERBS.has(first)) return this.start()

    // Bare direction words ("north", "e") and bare nouns as a last resort.
    const dir = resolveDirection(tokens)
    if (dir) return this.doMove(dir)
    if (rest.length === 0) {
      const item = findItem(this.game, first)
      if (item) return this.describeItem(item)
      return this.game.rooms[this.state.roomId].description
    }
    return "I don't know how to do that."
  }

  // -- verbs ----------------------------------------------------------------

  private doLook(nouns: string[]): string {
    const room = this.game.rooms[this.state.roomId]
    const noun = nounPhrase(nouns)
    if (noun) {
      const item = findItem(this.game, noun)
      if (item) return this.describeItem(item)
      return `You don't see anything special about "${nouns.join(" ")}" here.`
    }
    return this.roomDescription(this.state.roomId)
  }

  private doMove(dir: Direction): string {
    const room = this.game.rooms[this.state.roomId]
    this.state.moves++

    // Blocked exit?
    const block = room.block
    if (block?.exit === dir && !this.state.flags[block.flag]) {
      return block.message
    }
    // Dark room requires a light source to traverse.
    if (room.needsLight === dir && this.state.lights.length === 0) {
      return this.grueAttack()
    }

    const destId = room.exits[dir]
    if (!destId) return "You can't go that way."
    const dest = this.game.rooms[destId]

    // Destination is dark and you have no light — the grue!
    if (dest.dark && this.state.lights.length === 0) {
      return this.grueAttack()
    }

    this.state.roomId = destId
    return this.roomDescription(destId)
  }

  private doTake(nouns: string[]): string {
    const room = this.game.rooms[this.state.roomId]
    const noun = nounPhrase(nouns)
    const item = findItem(this.game, noun)
    if (!item) return `You can't take "${noun}" — that's not a thing here.`
    if (this.state.inventory.includes(item.id)) return `You already have the ${item.name}.`
    if (!room.items?.includes(item.id) && !item.takeable) {
      return `You can't take the ${item.name}. It stays put.`
    }
    if (!item.takeable) {
      return `The ${item.name} can't be carried. ${item.description}`
    }
    if (!room.items?.includes(item.id)) return `There's no ${item.name} here.`
    this.state.inventory.push(item.id)
    room.items = room.items.filter((i) => i !== item.id)
    if (this.game.treasures.includes(item.id)) this.bumpScore()
    return `Taken. You now have the ${item.name}.`
  }

  private doDrop(nouns: string[]): string {
    const room = this.game.rooms[this.state.roomId]
    const noun = nounPhrase(nouns)
    const item = findItem(this.game, noun)
    if (!item || !this.state.inventory.includes(item.id)) {
      return `You don't have "${noun}".`
    }
    this.state.inventory = this.state.inventory.filter((i) => i !== item.id)
    this.state.lights = this.state.lights.filter((l) => l !== item.id)
    room.items = [...(room.items ?? []), item.id]
    return `Dropped the ${item.name} here.`
  }

  private doInventory(): string {
    if (this.state.inventory.length === 0) return "You're carrying nothing."
    const names = this.state.inventory.map(
      (id) => this.game.items[id]?.name ?? id
    )
    return `You're carrying: ${names.join(", ")}`
  }

  private doUse(nouns: string[]): string {
    // Support "use X", "use X on Y", and "attack Y with X".
    let itemName: string
    let target: string | undefined
    const onIdx = nouns.indexOf("on")
    const withIdx = nouns.indexOf("with")
    if (onIdx >= 0) {
      itemName = nounPhrase(nouns.slice(0, onIdx))
      target = nounPhrase(nouns.slice(onIdx + 1))
    } else if (withIdx >= 0) {
      // "<verb> <target> with <item>" → item is after "with"
      itemName = nounPhrase(nouns.slice(withIdx + 1))
      target = nounPhrase(nouns.slice(0, withIdx))
    } else {
      itemName = nounPhrase(nouns)
    }

    const item = findItem(this.game, itemName)
    if (!item) return `Use what? I don't see "${itemName}".`
    const room = this.game.rooms[this.state.roomId]
    const here = room.items?.includes(item.id) ?? false
    const held = this.state.inventory.includes(item.id)
    if (!held && !here) {
      return `You don't have the ${item.name}, and it isn't in this room.`
    }
    // Non-carryable room objects (a mirror, a journal, a toilet) can
    // still be interacted with while you're in the room.
    if (!held && !item.takeable) {
      if (item.use) return item.use(this.state, target)
      return `The ${item.name} doesn't respond to that.`
    }
    if (!held) return `You don't have the ${item.name}.`
    if (item.use) return item.use(this.state, target)
    return `Using the ${item.name} does nothing here.`
  }

  private doHelp(): string {
    return (
      "Commands:\n" +
      "  look / examine <thing>       inspect your surroundings\n" +
      "  go <north|south|east|west>   move between rooms\n" +
      "  take / drop <item>           manage your inventory\n" +
      "  use <item> [on <thing>]      light, unlock, attack, read...\n" +
      "  inventory                    what you're carrying\n" +
      "  score                        treasures collected\n" +
      "  hint                         a nudge for the current room\n" +
      "  restart                      start over"
    )
  }

  doScore(): string {
    const { score, maxScore, moves } = this.state
    const base = `You have collected ${score} of ${maxScore} treasures in ${moves} moves.`
    return this.state.won ? `${base}\n${this.game.winMessage}` : base
  }

  hint(): string {
    return (
      this.game.hints[this.state.roomId] ??
      "No hint for this room. Explore!"
    )
  }

  // -- helpers --------------------------------------------------------------

  private describeItem(item: GameItem): string {
    if (this.state.inventory.includes(item.id)) {
      return `${item.name}: ${item.description}`
    }
    return item.description
  }

  private roomDescription(roomId: string): string {
    const room = this.game.rooms[roomId]
    let out = `[${room.name}]\n${room.description}`

    if (room.dark && this.state.lights.length === 0) {
      out = `[${room.name}]\nIt is pitch black. You are likely to be eaten by a grue. (Bring a light source.)`
    }

    if (room.items && room.items.length > 0 && !(room.dark && this.state.lights.length === 0)) {
      const items = room.items
        .map((id) => this.game.items[id]?.name ?? id)
        .join(", ")
      out += `\n\nYou can see: ${items}`
    }

    const exits = Object.keys(room.exits)
    if (exits.length) {
      out += `\nExits: ${exits.join(", ")}`
    }
    const block = room.block
    if (block && !this.state.flags[block.flag]) {
      out += `\n(${block.message})`
    }
    if (room.onLook) out += `\n${room.onLook(this.state)}`
    return out
  }

  private grueAttack(): string {
    // Classic grue: without light, it eats you and you flee, dropping loot.
    this.state.moves++
    const dropped: string[] = []
    if (this.state.inventory.length > 0) {
      const victim = this.state.inventory[0]
      this.state.inventory = this.state.inventory.slice(1)
      this.state.lights = this.state.lights.filter((l) => l !== victim)
      dropped.push(this.game.items[victim]?.name ?? victim)
      const room = this.game.rooms[this.state.roomId]
      room.items = [...(room.items ?? []), victim]
    }
    const message =
      "A hideous slithering fills the darkness. A GRUE! It lunges, and you " +
      "stumble backward, losing your nerve and your grip on things.\n\n" +
      (dropped.length ? `You dropped the ${dropped.join(", ")} in your panic. ` : "")
    // Fall back to the start room if this room has no safe exit.
    this.state.roomId = this.game.startRoom
    return message + this.roomDescription(this.state.roomId)
  }

  private bumpScore(): void {
    const { score, maxScore } = this.state
    const newScore = score + 1
    this.state.score = newScore
    if (newScore >= maxScore && !this.state.won) {
      this.state.won = true
    }
  }
}

function freshState(game: Game): GameState {
  return {
    roomId: game.startRoom,
    inventory: [],
    flags: {},
    lights: [],
    moves: 0,
    score: 0,
    maxScore: game.treasures.length,
    won: false,
  }
}
