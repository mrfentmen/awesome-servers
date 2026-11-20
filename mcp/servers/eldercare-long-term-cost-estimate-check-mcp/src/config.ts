import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-long-term-cost-estimate-check-mcp",
  "title": "Long-Term Cost Estimate Audit",
  "description": "Audit long-term cost estimate by housing, care, medical, supplies coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_long_term_cost_estimate",
  "entity": "long-term cost estimate item",
  "categories": [
    {
      "id": "housing",
      "label": "Housing",
      "baseline": 2
    },
    {
      "id": "care",
      "label": "Care",
      "baseline": 2
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "supplies",
      "label": "Supplies",
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
        "housing"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_long_term_cost_estimate-housing-1",
      "name": "Housing primary",
      "category": "housing",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-care-2",
      "name": "Care primary",
      "category": "care",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-medical-3",
      "name": "Medical primary",
      "category": "medical",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-supplies-4",
      "name": "Supplies primary",
      "category": "supplies",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-housing-5",
      "name": "Housing backup",
      "category": "housing",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-care-6",
      "name": "Care backup",
      "category": "care",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-medical-7",
      "name": "Medical backup",
      "category": "medical",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_long_term_cost_estimate-supplies-8",
      "name": "Supplies backup",
      "category": "supplies",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
