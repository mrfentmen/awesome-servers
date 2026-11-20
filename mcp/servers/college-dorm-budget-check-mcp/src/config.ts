import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-dorm-budget-check-mcp",
  "title": "Dorm Budget Audit",
  "description": "Audit dorm budget by housing, food, supplies, transport coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_dorm_budget",
  "entity": "dorm budget item",
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
      "id": "supplies",
      "label": "Supplies",
      "baseline": 2
    },
    {
      "id": "transport",
      "label": "Transport",
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
        "housing"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "transport"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_dorm_budget-housing-1",
      "name": "Housing primary",
      "category": "housing",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-food-2",
      "name": "Food primary",
      "category": "food",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-supplies-3",
      "name": "Supplies primary",
      "category": "supplies",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-transport-4",
      "name": "Transport primary",
      "category": "transport",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-housing-5",
      "name": "Housing backup",
      "category": "housing",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-food-6",
      "name": "Food backup",
      "category": "food",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-supplies-7",
      "name": "Supplies backup",
      "category": "supplies",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_dorm_budget-transport-8",
      "name": "Transport backup",
      "category": "transport",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
