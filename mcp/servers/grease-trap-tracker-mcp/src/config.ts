import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "grease-trap-tracker-mcp",
  "title": "grease trap tracker Tracker",
  "description": "Real local JSON analysis of grease trap tracker in the Water & Waste lane. 25 MCP tools, no paywall.",
  "prefix": "util_grease_trap_tracker",
  "entity": "grease trap tracker item",
  "categories": [
    {
      "id": "util",
      "label": "util",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "grease-trap",
      "label": "grease-trap",
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
        "util"
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
      "id": "util_grease_trap_tracker-util-1",
      "name": "util primary",
      "category": "util",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-grease-trap-3",
      "name": "grease-trap primary",
      "category": "grease-trap",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-util-5",
      "name": "util backup",
      "category": "util",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-grease-trap-7",
      "name": "grease-trap backup",
      "category": "grease-trap",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
