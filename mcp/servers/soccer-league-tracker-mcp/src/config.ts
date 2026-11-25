import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "soccer-league-tracker-mcp",
  "title": "soccer league tracker Tracker",
  "description": "Real local JSON analysis of soccer league tracker in the Youth & Amateur Sports lane. 25 MCP tools, no paywall.",
  "prefix": "youthsports_soccer_league_tracker",
  "entity": "soccer league tracker item",
  "categories": [
    {
      "id": "youthsports",
      "label": "youthsports",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "soccer-league",
      "label": "soccer-league",
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
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "youthsports"
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
      "id": "youthsports_soccer_league_tracker-youthsports-1",
      "name": "youthsports primary",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-soccer-league-3",
      "name": "soccer-league primary",
      "category": "soccer-league",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-youthsports-5",
      "name": "youthsports backup",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-soccer-league-7",
      "name": "soccer-league backup",
      "category": "soccer-league",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
      "id": "youthsports_soccer_league_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "soccer",
        "league"
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
