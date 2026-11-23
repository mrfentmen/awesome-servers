import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "quince-jelly-guide-mcp",
  "title": "Quince Jelly Guide Audit",
  "description": "Real local JSON analysis of quince jelly guide in the Quince Jelly lane. 25 MCP tools, no paywall.",
  "prefix": "quince_jelly_quince_jelly_guide",
  "entity": "quince jelly guide item",
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
      "id": "quince_jelly_quince_jelly_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
      "id": "quince_jelly_quince_jelly_guide-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "quince-jelly",
        "quince",
        "jelly"
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
