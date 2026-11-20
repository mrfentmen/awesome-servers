import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-emergency-budget-check-mcp",
  "title": "Emergency Budget Audit",
  "description": "Audit emergency budget by housing, food, transport, cash coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_emergency_budget",
  "entity": "emergency budget item",
  "categories": [
    {
      "id": "housing",
      "label": "Housing",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 2
    },
    {
      "id": "transport",
      "label": "Transport",
      "baseline": 2
    },
    {
      "id": "cash",
      "label": "Cash",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 30,
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
        "cash"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_emergency_budget-housing-1",
      "name": "Housing primary",
      "category": "housing",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-food-2",
      "name": "Food primary",
      "category": "food",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-transport-3",
      "name": "Transport primary",
      "category": "transport",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-cash-4",
      "name": "Cash primary",
      "category": "cash",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-housing-5",
      "name": "Housing backup",
      "category": "housing",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-food-6",
      "name": "Food backup",
      "category": "food",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-transport-7",
      "name": "Transport backup",
      "category": "transport",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_emergency_budget-cash-8",
      "name": "Cash backup",
      "category": "cash",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
