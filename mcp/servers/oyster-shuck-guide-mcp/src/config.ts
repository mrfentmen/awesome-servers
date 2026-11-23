import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "oyster-shuck-guide-mcp",
  "title": "Oyster Shuck Guide Audit",
  "description": "Real local JSON analysis of oyster shuck guide in the Oyster Shuck lane. 25 MCP tools, no paywall.",
  "prefix": "oyster_shuck_oyster_shuck_guide",
  "entity": "oyster shuck guide item",
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
      "id": "oyster_shuck_oyster_shuck_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
      "id": "oyster_shuck_oyster_shuck_guide-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "oyster-shuck",
        "oyster",
        "shuck"
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
