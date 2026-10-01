import type { Game, GameState } from "./engine.js"

/**
 * The bundled games. Each is declared as pure data — rooms, items with
 * use-effects, hints — so new games are easy to add without touching
 * the engine.
 */

// ---------------------------------------------------------------------------
// The Colossal Dungeon — a classic-style Zork homage
// ---------------------------------------------------------------------------

export const colossalDungeon: Game = {
  id: "colossal-dungeon",
  name: "The Colossal Dungeon",
  intro:
    "You stand at the edge of a forgotten cave system, an adventurer's " +
    "journal in your pocket and a distant rumbling in the earth. Four " +
    "treasures lie within. Find them all to escape the dungeon.",
  startRoom: "clearing",
  winMessage:
    "The dungeon's final door grinds open. Sunlight! You walk out with " +
    "all four treasures and the bards will sing of you. Well played, adventurer.",
  hints: {
    clearing:
      "The clearing holds two things worth grabbing before you descend. " +
      "One of them makes light — you'll want it for the dark tunnel.",
    "forest-path":
      "A sword lies abandoned by the path. The troll up ahead won't move " +
      "for talk, but he might respect a blade.",
    "cave-entrance":
      "The tunnel beyond is pitch black. A lit lantern is the difference " +
      "between treasure and a grue's lunch.",
    "dark-tunnel":
      "The coins clatter underfoot, but watch for the grate at the far end.",
    "treasure-vault":
      "The trophy is yours if you can reach it — and the lake shore below " +
      "offers a shortcut out, if only something could unlock that grate.",
    "lake-shore":
      "That rusty key from the clearing isn't just for show.",
  },
  rooms: {
    clearing: {
      id: "clearing",
      name: "Grassy Clearing",
      description:
        "A sunlit clearing ringed by gnarled oaks. An old, weathered " +
        "wooden sign reads 'COLOSSAL DUNGEON — enter at your own risk.'",
      exits: { north: "forest-path" },
      items: ["lantern", "rusty-key"],
    },
    "forest-path": {
      id: "forest-path",
      name: "Forest Path",
      description:
        "The path narrows between mossy boulders. Ahead, a dark cave " +
        "mouth gapes in the hillside. An abandoned sword lies half-buried in the dirt.",
      exits: { south: "clearing", north: "cave-entrance" },
      items: ["sword"],
    },
    "cave-entrance": {
      id: "cave-entrance",
      name: "Cave Entrance",
      description:
        "The air turns cold and damp. A troll sits on a rock, picking " +
        "its teeth with a rib bone, blocking the passage north.",
      exits: { south: "forest-path", north: "dark-tunnel" },
      block: {
        exit: "north",
        flag: "troll-defeated",
        message: "The troll flexes. 'Toll or fight, little snack.'",
      },
    },
    "dark-tunnel": {
      id: "dark-tunnel",
      name: "Dark Tunnel",
      description:
        "Total darkness swallows the torchless. A carpet of ancient coins " +
        "crunches underfoot. A rusty grate blocks the way east.",
      dark: true,
      needsLight: "east",
      exits: { south: "cave-entrance", east: "lake-shore" },
      items: ["coin-pile"],
    },
    "treasure-vault": {
      id: "treasure-vault",
      name: "Treasure Vault",
      description:
        "A vault carved from living rock. A single golden trophy sits on " +
        "a pedestal, gleaming. The air tastes like victory.",
      exits: { south: "dark-tunnel", east: "lake-shore" },
      items: ["golden-trophy"],
    },
    "lake-shore": {
      id: "lake-shore",
      name: "Lake Shore",
      description:
        "An underground lake laps at a pebbled shore. A rusty grate in the " +
        "wall leads back toward the clearing — locked tight.",
      exits: { north: "dark-tunnel", east: "clearing" },
      block: {
        exit: "east",
        flag: "grate-unlocked",
        message: "The grate is rusted shut. It needs a key.",
      },
    },
  },
  items: {
    lantern: {
      id: "lantern",
      name: "brass lantern",
      aliases: ["lantern", "brass", "light"],
      takeable: true,
      description: "A dented brass lantern, dry and ready for oil.",
      use: (state) => {
        if (state.lights.includes("lantern")) {
          return "The lantern is already burning brightly."
        }
        state.lights.push("lantern")
        return "You strike a match and the lantern roars to life. The dark is no longer your enemy."
      },
    },
    "rusty-key": {
      id: "rusty-key",
      name: "rusty key",
      aliases: ["key", "rusty"],
      takeable: true,
      description: "A heavy iron key, pitted with rust. It feels important.",
      use: (state) => {
        if (state.roomId !== "lake-shore") {
          return "Nothing here accepts the key."
        }
        state.flags["grate-unlocked"] = true
        return "The key turns with a groan of ancient iron. The grate swings open — a shortcut back to the clearing!"
      },
    },
    sword: {
      id: "sword",
      name: "iron sword",
      aliases: ["sword", "iron", "blade", "weapon"],
      takeable: true,
      description: "A reliable iron sword. Its edge gleams with intent.",
      use: (state) => {
        if (state.roomId !== "cave-entrance") {
          return "You swing the sword around. There's nothing to fight here."
        }
        if (state.flags["troll-defeated"]) {
          return "The troll is already dealt with. The sword feels lighter now."
        }
        state.flags["troll-defeated"] = true
        return "You raise the sword and charge. The troll yelps and scrambles " +
          "up the cave wall, vanishing into a crack. The passage north is open!"
      },
    },
    "coin-pile": {
      id: "coin-pile",
      name: "pile of coins",
      aliases: ["coins", "coin", "pile", "gold", "treasure"],
      takeable: true,
      description: "A sprawl of ancient gold coins. They still shine.",
    },
    "golden-trophy": {
      id: "golden-trophy",
      name: "golden trophy",
      aliases: ["trophy", "golden", "cup"],
      takeable: true,
      description: "The legendary Golden Trophy of the Colossal Dungeon. It hums with history.",
    },
  },
  treasures: ["lantern", "rusty-key", "coin-pile", "golden-trophy"],
}

// ---------------------------------------------------------------------------
// Brainrot Manor — a meme palace (bonus easter egg game)
// ---------------------------------------------------------------------------

export const brainrotManor: Game = {
  id: "brainrot-manor",
  name: "Brainrot Manor",
  intro:
    "You have been summoned to the Manor, where the internet's finest " +
    "vibes are locked behind four doors. Collect all four aura artifacts " +
    "to achieve Main Character status.",
  startRoom: "rizz-lounge",
  winMessage:
    "A golden light descends. The algorithm itself crowns you. " +
    "You have maxed your aura. You are the main character. (+10,000 aura)",
  hints: {
    "rizz-lounge":
      "The mirror here gives +1000 aura — but only if you look into it.",
    "ohio-backrooms":
      "That grimace shake won't drink itself. And it might make the exit appear.",
    "sigma-cave":
      "The grindset journal can be read. Knowledge is aura.",
    "skibidi-throne":
      "The golden toilet is a conversation piece. Examine it.",
    "gyatt-garden":
      "Aura points are just lying around here. Take them.",
    "fanum-kitchen":
      "The fries are stolen, but they're yours now. Eat them.",
  },
  rooms: {
    "rizz-lounge": {
      id: "rizz-lounge",
      name: "The Rizz Lounge",
      description:
        "Neon lights hum over plush couches. A full-length mirror dominates " +
        "the wall, and the air smells faintly of cologne and confidence.",
      exits: { north: "ohio-backrooms", east: "sigma-cave" },
      items: ["mirror"],
    },
    "ohio-backrooms": {
      id: "ohio-backrooms",
      name: "The Ohio Backrooms",
      description:
        "Yellow wallpaper, buzzing fluorescent lights, and an exit that " +
        "seems to move whenever you blink. A grimace shake sits on a folding table. " +
        "Truly, only in Ohio.",
      exits: { south: "rizz-lounge", west: "skibidi-throne", east: "gyatt-garden" },
      items: ["grimace-shake"],
    },
    "sigma-cave": {
      id: "sigma-cave",
      name: "The Sigma Cave",
      description:
        "A minimalist cave with a single weight bench, a candle, and a " +
        "leather journal titled 'THE GRINDSET'. No one enters, no one leaves " +
        "until they have improved.",
      exits: { west: "rizz-lounge", north: "skibidi-throne" },
      items: ["grindset-journal"],
    },
    "skibidi-throne": {
      id: "skibidi-throne",
      name: "The Skibidi Throne Room",
      description:
        "A golden toilet throne sits at the far end of a long red carpet. " +
        "A surreal soundtrack plays on loop somewhere. The internet's chaos " +
        "is palpable here.",
      exits: { east: "ohio-backrooms", south: "sigma-cave" },
      items: ["golden-toilet"],
    },
    "gyatt-garden": {
      id: "gyatt-garden",
      name: "The Gyatt Garden",
      description:
        "A courtyard of perfectly trimmed hedges shaped like W's. Sparkling " +
        "orb-like aura points float just within reach.",
      exits: { west: "ohio-backrooms" },
      items: ["aura-points"],
    },
    "fanum-kitchen": {
      id: "fanum-kitchen",
      name: "The Fanum Tax Kitchen",
      description:
        "A suspiciously well-stocked kitchen. A plate of clearly stolen " +
        "fries sits unattended. Taking a bite is only natural.",
      exits: { south: "skibidi-throne" },
      items: ["stolen-fries"],
    },
  },
  items: {
    mirror: {
      id: "mirror",
      name: "mirror of looksmaxxing",
      aliases: ["mirror", "glass", "looksmaxxing"],
      takeable: false,
      description: "You glance in and see an 11/10. It's you. +1000 aura.",
      use: (state) => {
        state.flags["mirror-blessed"] = true
        return "You lock eyes with yourself. The mirror whispers: 'It's you, king.' +1000 aura."
      },
    },
    "grimace-shake": {
      id: "grimace-shake",
      name: "grimace shake",
      aliases: ["shake", "grimace", "mcdonalds", "purple"],
      takeable: true,
      description: "A suspiciously purple milkshake. It was here before you. It will be here after.",
      use: (state) => {
        if (state.flags["shake-drunk"]) {
          return "You've already sipped the forbidden nectar once today."
        }
        state.flags["shake-drunk"] = true
        return "You drink. Colors shift. Somewhere, a Grimace dances. You feel +1 aura and a deep, cosmic confusion."
      },
    },
    "grindset-journal": {
      id: "grindset-journal",
      name: "grindset journal",
      aliases: ["journal", "book", "grindset", "notebook"],
      takeable: false,
      description: "Page 1: 'Sleep is for the weak.' Page 2: 'Rest is for the weak.' Page 3: '...Wait.'",
      use: () =>
        "You read the journal. It's just 'lock in' written 400 times, " +
        "followed by one tear-stained 'help'. Knowledge is aura.",
    },
    "golden-toilet": {
      id: "golden-toilet",
      name: "golden toilet",
      aliases: ["toilet", "throne", "golden"],
      takeable: false,
      description:
        "A solid-gold toilet. You have reached the highest level of human " +
        "excess. Examining it fills you with +1 aura and a sense of dread.",
      use: () => "You do NOT use the golden toilet. Some doors should stay closed.",
    },
    "aura-points": {
      id: "aura-points",
      name: "aura points",
      aliases: ["aura", "points", "orb", "orbs"],
      takeable: true,
      description: "Sparkling motes of pure social currency. They feel like a like-bomb on your best post.",
    },
    "stolen-fries": {
      id: "stolen-fries",
      name: "stolen fries",
      aliases: ["fries", "food", "fanum"],
      takeable: true,
      description: "A basket of fries, allegedly belonging to Fanum. What's his is yours now.",
      use: (state) => {
        if (state.flags["fries-eaten"]) {
          return "You already committed the tax fraud."
        }
        state.flags["fries-eaten"] = true
        return "You eat the fries. Somewhere, a streamer sighs. The fanum tax has been collected. +1 aura."
      },
    },
  },
  treasures: ["aura-points", "stolen-fries"],
}

export const GAMES: Record<string, Game> = {
  "colossal-dungeon": colossalDungeon,
  "brainrot-manor": brainrotManor,
}

export function describeGames(): string {
  return Object.values(GAMES)
    .map((g) => `• ${g.id} — ${g.name}: ${g.intro.split(".")[0]}.`)
    .join("\n")
}

// Reference to keep GameState import used in type positions.
export type { GameState }
