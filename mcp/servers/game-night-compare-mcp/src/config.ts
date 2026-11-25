import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "game-night-compare-mcp",
  "title": "game-night compare Compare",
  "description": "Real local JSON analysis of game-night compare in the Entertainment & Gaming lane. 25 MCP tools, no paywall.",
  "prefix": "entertainment_game_night_compare",
  "entity": "game-night compare item",
  "categories": [
    {
      "id": "entertainment",
      "label": "entertainment",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "game-night",
      "label": "game-night",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "entertainment"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "entertainment_game_night_compare-entertainment-1",
      "name": "entertainment primary",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-game-night-3",
      "name": "game-night primary",
      "category": "game-night",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-entertainment-5",
      "name": "entertainment backup",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-game-night-7",
      "name": "game-night backup",
      "category": "game-night",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "entertainment_game_night_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "game",
        "night"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
