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
      "baseline": 6
    },
    {
      "id": "missions",
      "label": "Missions",
      "baseline": 8
    },
    {
      "id": "vehicles",
      "label": "Vehicles",
      "baseline": 6
    },
    {
      "id": "weapons",
      "label": "Weapons",
      "baseline": 5
    },
    {
      "id": "activities",
      "label": "Side activities",
      "baseline": 4
    },
    {
      "id": "collectibles",
      "label": "Collectibles",
      "baseline": 5
    },
    {
      "id": "tips",
      "label": "Tips",
      "baseline": 4
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
      "id": "gta6-prologue",
      "name": "Prologue heist",
      "category": "missions",
      "tags": [
        "story",
        "heist"
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
      "name": "First score",
      "category": "missions",
      "tags": [
        "story",
        "score"
      ],
      "cost": 5000,
      "quantity": 1,
      "acquired": "2026-02-01",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-sports-car",
      "name": "Pfister Comet",
      "category": "vehicles",
      "tags": [
        "sports",
        "garage"
      ],
      "cost": 150000,
      "quantity": 1,
      "acquired": "2026-03-01",
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
      "acquired": "2026-03-01",
      "lastUsed": "2026-10-15",
      "condition": "fair",
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
      "id": "gta6-pistol",
      "name": "Pistol Mk II",
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
      "id": "gta6-street-race",
      "name": "Street race series",
      "category": "activities",
      "tags": [
        "racing",
        "side"
      ],
      "cost": 2000,
      "quantity": 6,
      "acquired": "2026-04-01",
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
      "acquired": "2026-04-01",
      "lastUsed": "2026-10-15",
      "condition": "good",
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
      "acquired": "2026-05-01",
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
      "acquired": "2026-05-01",
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
    }
  ]
}
