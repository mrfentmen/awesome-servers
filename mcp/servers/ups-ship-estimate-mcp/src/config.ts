import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ups-ship-estimate-mcp",
  "title": "Ups Ship Estimate Tracker",
  "description": "Real local JSON analysis of ups ship estimate in the Ups Ship lane. 25 MCP tools, no paywall.",
  "prefix": "ups_ship_ups_ship_estimate",
  "entity": "ups ship estimate item",
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
      "id": "ups_ship_ups_ship_estimate-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
