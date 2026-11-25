import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "meal-plan-audit-mcp",
  "title": "meal plan audit Audit",
  "description": "Real local JSON analysis of meal plan audit in the Food & Farm lane. 25 MCP tools, no paywall.",
  "prefix": "food_meal_plan_audit",
  "entity": "meal plan audit item",
  "categories": [
    {
      "id": "food",
      "label": "food",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "meal-plan",
      "label": "meal-plan",
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
        "food"
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
      "id": "food_meal_plan_audit-food-1",
      "name": "food primary",
      "category": "food",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-meal-plan-3",
      "name": "meal-plan primary",
      "category": "meal-plan",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-food-5",
      "name": "food backup",
      "category": "food",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-meal-plan-7",
      "name": "meal-plan backup",
      "category": "meal-plan",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
      "id": "food_meal_plan_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "food-farm",
        "meal",
        "plan"
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
