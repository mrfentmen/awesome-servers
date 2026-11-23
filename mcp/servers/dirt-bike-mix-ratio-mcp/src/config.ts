import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dirt-bike-mix-ratio-mcp",
  "title": "Dirt Bike Mix Planner",
  "description": "Real local JSON analysis of dirt bike mix in the Dirt Bike lane. 25 MCP tools, no paywall.",
  "prefix": "dirt_bike_dirt_bike_mix_ratio",
  "entity": "dirt bike mix item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "dirt_bike_dirt_bike_mix_ratio-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
