import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "terminix-pest-plan-mcp",
  "title": "Terminix Pest Plan Tracker",
  "description": "Real local JSON analysis of terminix pest plan in the Terminix Pest lane. 25 MCP tools, no paywall.",
  "prefix": "terminix_pest_terminix_pest_plan",
  "entity": "terminix pest plan item",
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
      "id": "terminix_pest_terminix_pest_plan-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
