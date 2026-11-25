import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "retro-gaming-guide-mcp",
  "title": "retro-gaming guide Guide",
  "description": "Real local JSON analysis of retro-gaming guide in the Entertainment & Gaming lane. 25 MCP tools, no paywall.",
  "prefix": "entertainment_retro_gaming_guide",
  "entity": "retro-gaming guide item",
  "categories": [
    {
      "id": "entertainment",
      "label": "entertainment",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "retro-gaming",
      "label": "retro-gaming",
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
      "id": "entertainment_retro_gaming_guide-entertainment-1",
      "name": "entertainment primary",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-retro-gaming-3",
      "name": "retro-gaming primary",
      "category": "retro-gaming",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-entertainment-5",
      "name": "entertainment backup",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-retro-gaming-7",
      "name": "retro-gaming backup",
      "category": "retro-gaming",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
