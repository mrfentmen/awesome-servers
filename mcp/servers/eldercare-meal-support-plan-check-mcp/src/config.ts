import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-meal-support-plan-check-mcp",
  "title": "Meal Support Plan Audit",
  "description": "Audit meal support plan by meals, groceries, supplements, diet coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_meal_support_plan",
  "entity": "meal support plan item",
  "categories": [
    {
      "id": "meals",
      "label": "Meals",
      "baseline": 2
    },
    {
      "id": "groceries",
      "label": "Groceries",
      "baseline": 2
    },
    {
      "id": "supplements",
      "label": "Supplements",
      "baseline": 2
    },
    {
      "id": "diet",
      "label": "Diet",
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
        "meals"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "diet"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_meal_support_plan-meals-1",
      "name": "Meals primary",
      "category": "meals",
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
      "id": "eldercare_meal_support_plan-groceries-2",
      "name": "Groceries primary",
      "category": "groceries",
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
      "id": "eldercare_meal_support_plan-supplements-3",
      "name": "Supplements primary",
      "category": "supplements",
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
      "id": "eldercare_meal_support_plan-diet-4",
      "name": "Diet primary",
      "category": "diet",
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
      "id": "eldercare_meal_support_plan-meals-5",
      "name": "Meals backup",
      "category": "meals",
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
      "id": "eldercare_meal_support_plan-groceries-6",
      "name": "Groceries backup",
      "category": "groceries",
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
      "id": "eldercare_meal_support_plan-supplements-7",
      "name": "Supplements backup",
      "category": "supplements",
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
      "id": "eldercare_meal_support_plan-diet-8",
      "name": "Diet backup",
      "category": "diet",
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
