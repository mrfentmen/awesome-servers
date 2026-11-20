import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gta-6-mcp",
  "title": "GTA 6 Guide Audit",
  "description": "Track GTA 6 progress across characters, missions, locations, vehicles, weapons and collectibles. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "gta6_guide",
  "entity": "gta 6 item",
  "categories": [
    {
      "id": "characters",
      "label": "Characters",
      "baseline": 4
    },
    {
      "id": "locations",
      "label": "Locations",
      "baseline": 8
    },
    {
      "id": "missions",
      "label": "Missions",
      "baseline": 8
    },
    {
      "id": "vehicles",
      "label": "Vehicles",
      "baseline": 8
    },
    {
      "id": "weapons",
      "label": "Weapons",
      "baseline": 8
    },
    {
      "id": "activities",
      "label": "Side activities",
      "baseline": 8
    },
    {
      "id": "collectibles",
      "label": "Collectibles",
      "baseline": 6
    },
    {
      "id": "tips",
      "label": "Tips",
      "baseline": 8
    }
  ],
  "metric": {
    "id": "completion_rate",
    "label": "Completion rate",
    "unit": "percent",
    "target": 100,
    "direction": "higher"
  },
  "target": {
    "maxItems": 40,
    "budget": 1500,
    "coverage": 0.8,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "story",
      "label": "Story path",
      "categories": [
        "characters",
        "missions"
      ]
    },
    {
      "id": "world",
      "label": "World coverage",
      "categories": [
        "locations",
        "collectibles"
      ]
    },
    {
      "id": "loadout",
      "label": "Loadout",
      "categories": [
        "vehicles",
        "weapons"
      ]
    }
  ],
  "sample": [
    {
      "id": "gta6-lucia",
      "name": "Lucia Caminos",
      "category": "characters",
      "tags": [
        "vice-city",
        "protagonist"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-jason",
      "name": "Jason Duval",
      "category": "characters",
      "tags": [
        "leonida",
        "protagonist"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-switch",
      "name": "Switching protagonists",
      "category": "characters",
      "tags": [
        "mechanic",
        "story"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-crew",
      "name": "Crew contacts",
      "category": "characters",
      "tags": [
        "heist",
        "tracker"
      ],
      "cost": 0,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-vice-beach",
      "name": "Vice Beach",
      "category": "locations",
      "tags": [
        "vice-city",
        "map"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-grassrivers",
      "name": "Grassrivers",
      "category": "locations",
      "tags": [
        "leonida",
        "map"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-ocean-strip",
      "name": "Ocean Strip",
      "category": "locations",
      "tags": [
        "vice-city",
        "neon"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-port-vc",
      "name": "Port of Vice City",
      "category": "locations",
      "tags": [
        "docks",
        "smuggling"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-airport",
      "name": "Escobar Airport",
      "category": "locations",
      "tags": [
        "planes",
        "travel"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-keys",
      "name": "Leonida Keys",
      "category": "locations",
      "tags": [
        "islands",
        "boats"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-downtown",
      "name": "Downtown Vice City",
      "category": "locations",
      "tags": [
        "city",
        "robbery"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-bayou",
      "name": "Bayou country",
      "category": "locations",
      "tags": [
        "swamp",
        "hiding"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-prologue",
      "name": "Prologue basics",
      "category": "missions",
      "tags": [
        "story",
        "tutorial"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-first-score",
      "name": "First score playbook",
      "category": "missions",
      "tags": [
        "story",
        "score"
      ],
      "cost": 5000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-getaway",
      "name": "Getaway driving playbook",
      "category": "missions",
      "tags": [
        "driving",
        "escape"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-stealth",
      "name": "Stealth approach playbook",
      "category": "missions",
      "tags": [
        "stealth",
        "infiltration"
      ],
      "cost": 1500,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-heist-prep",
      "name": "Heist prep playbook",
      "category": "missions",
      "tags": [
        "heist",
        "prep"
      ],
      "cost": 10000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-finale",
      "name": "Finale playbook",
      "category": "missions",
      "tags": [
        "story",
        "finale"
      ],
      "cost": 20000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-side-chain",
      "name": "Side-job chain",
      "category": "missions",
      "tags": [
        "side",
        "cash"
      ],
      "cost": 2000,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-rank-replay",
      "name": "Replay for rank",
      "category": "missions",
      "tags": [
        "replay",
        "gold"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-sports-car",
      "name": "Sports coupe",
      "category": "vehicles",
      "tags": [
        "sports",
        "garage"
      ],
      "cost": 150000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-boat",
      "name": "Smuggler boat",
      "category": "vehicles",
      "tags": [
        "water",
        "smuggling"
      ],
      "cost": 80000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-bike",
      "name": "Street motorcycle",
      "category": "vehicles",
      "tags": [
        "bike",
        "fast"
      ],
      "cost": 25000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-heli",
      "name": "Helicopter",
      "category": "vehicles",
      "tags": [
        "air",
        "escape"
      ],
      "cost": 500000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-suv",
      "name": "Armored SUV",
      "category": "vehicles",
      "tags": [
        "armor",
        "crew"
      ],
      "cost": 300000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-jetski",
      "name": "Jetski",
      "category": "vehicles",
      "tags": [
        "water",
        "beach"
      ],
      "cost": 15000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-plane",
      "name": "Smuggler plane",
      "category": "vehicles",
      "tags": [
        "air",
        "cargo"
      ],
      "cost": 750000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-truck",
      "name": "Armored truck",
      "category": "vehicles",
      "tags": [
        "armor",
        "heist"
      ],
      "cost": 400000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-pistol",
      "name": "Pistol",
      "category": "weapons",
      "tags": [
        "ammunation",
        "sidearm"
      ],
      "cost": 1200,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-rifle",
      "name": "Carbine rifle",
      "category": "weapons",
      "tags": [
        "ammunation",
        "rifle"
      ],
      "cost": 2500,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-shotgun",
      "name": "Pump shotgun",
      "category": "weapons",
      "tags": [
        "ammunation",
        "close"
      ],
      "cost": 1800,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-smg",
      "name": "SMG",
      "category": "weapons",
      "tags": [
        "ammunation",
        "driveby"
      ],
      "cost": 2200,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-sniper",
      "name": "Sniper rifle",
      "category": "weapons",
      "tags": [
        "ammunation",
        "long"
      ],
      "cost": 5000,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-armor",
      "name": "Body armor",
      "category": "weapons",
      "tags": [
        "ammunation",
        "defense"
      ],
      "cost": 800,
      "quantity": 5,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-explosives",
      "name": "Sticky bombs",
      "category": "weapons",
      "tags": [
        "ammunation",
        "heist"
      ],
      "cost": 1500,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-melee",
      "name": "Baseball bat",
      "category": "weapons",
      "tags": [
        "melee",
        "quiet"
      ],
      "cost": 200,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-street-race",
      "name": "Street race series",
      "category": "activities",
      "tags": [
        "racing",
        "side"
      ],
      "cost": 2000,
      "quantity": 6,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-fishing",
      "name": "Grassrivers fishing",
      "category": "activities",
      "tags": [
        "fishing",
        "side"
      ],
      "cost": 500,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-flight-school",
      "name": "Flight school",
      "category": "activities",
      "tags": [
        "flying",
        "skill"
      ],
      "cost": 3000,
      "quantity": 5,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-hunting",
      "name": "Bayou hunting",
      "category": "activities",
      "tags": [
        "hunting",
        "cash"
      ],
      "cost": 1000,
      "quantity": 6,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-diving",
      "name": "Wreck diving",
      "category": "activities",
      "tags": [
        "diving",
        "loot"
      ],
      "cost": 1200,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-taxi",
      "name": "Taxi work",
      "category": "activities",
      "tags": [
        "driving",
        "cash"
      ],
      "cost": 0,
      "quantity": 8,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-bar-games",
      "name": "Bar games",
      "category": "activities",
      "tags": [
        "leisure",
        "cash"
      ],
      "cost": 100,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-photography",
      "name": "Wildlife photography",
      "category": "activities",
      "tags": [
        "photo",
        "side"
      ],
      "cost": 300,
      "quantity": 10,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-signs",
      "name": "Hidden signs",
      "category": "collectibles",
      "tags": [
        "hidden",
        "map"
      ],
      "cost": 0,
      "quantity": 20,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-stashes",
      "name": "Smuggler stashes",
      "category": "collectibles",
      "tags": [
        "hidden",
        "loot"
      ],
      "cost": 0,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-jumps",
      "name": "Stunt jumps",
      "category": "collectibles",
      "tags": [
        "driving",
        "stunts"
      ],
      "cost": 0,
      "quantity": 15,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-packages",
      "name": "Hidden packages",
      "category": "collectibles",
      "tags": [
        "hidden",
        "cash"
      ],
      "cost": 0,
      "quantity": 25,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-photos",
      "name": "Photo landmarks",
      "category": "collectibles",
      "tags": [
        "photo",
        "map"
      ],
      "cost": 0,
      "quantity": 30,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-trials",
      "name": "Time trials",
      "category": "collectibles",
      "tags": [
        "racing",
        "solo"
      ],
      "cost": 0,
      "quantity": 10,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-wanted-tip",
      "name": "Lose wanted level",
      "category": "tips",
      "tags": [
        "cops",
        "evade"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-money-tip",
      "name": "Early money route",
      "category": "tips",
      "tags": [
        "money",
        "guide"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-armor-tip",
      "name": "Armor up before scores",
      "category": "tips",
      "tags": [
        "armor",
        "prep"
      ],
      "cost": 800,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-save-tip",
      "name": "Save often",
      "category": "tips",
      "tags": [
        "save",
        "habit"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-drive-tip",
      "name": "Getaway driving",
      "category": "tips",
      "tags": [
        "driving",
        "escape"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-health-tip",
      "name": "Snacks heal on the go",
      "category": "tips",
      "tags": [
        "health",
        "combat"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-cops-tip",
      "name": "Break line of sight",
      "category": "tips",
      "tags": [
        "cops",
        "stealth"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-prep-tip",
      "name": "Scout before the score",
      "category": "tips",
      "tags": [
        "heist",
        "prep"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
