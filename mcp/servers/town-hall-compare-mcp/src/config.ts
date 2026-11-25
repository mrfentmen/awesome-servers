import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "town-hall-compare-mcp",
  "title": "town hall compare Compare",
  "description": "Real local JSON analysis of town hall compare in the Local Government lane. 25 MCP tools, no paywall.",
  "prefix": "civic_town_hall_compare",
  "entity": "town hall compare item",
  "categories": [
    {
      "id": "civic",
      "label": "civic",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "town-hall",
      "label": "town-hall",
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
        "civic"
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
      "id": "civic_town_hall_compare-civic-1",
      "name": "civic primary",
      "category": "civic",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-town-hall-3",
      "name": "town-hall primary",
      "category": "town-hall",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-civic-5",
      "name": "civic backup",
      "category": "civic",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-town-hall-7",
      "name": "town-hall backup",
      "category": "town-hall",
      "tags": [
        "local-government",
        "town",
        "hall"
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
      "id": "civic_town_hall_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "local-government",
        "town",
        "hall"
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
