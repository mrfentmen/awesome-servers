import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ice-axe-length-mcp",
  "title": "Ice Axe Length Compare",
  "description": "Real local JSON analysis of ice axe length in the Ice Axe lane. 25 MCP tools, no paywall.",
  "prefix": "ice_axe_ice_axe_length",
  "entity": "ice axe length item",
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
      "id": "ice_axe_ice_axe_length-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
      "id": "ice_axe_ice_axe_length-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "ice-axe",
        "ice",
        "axe"
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
