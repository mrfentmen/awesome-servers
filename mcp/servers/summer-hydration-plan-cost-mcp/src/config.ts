import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-hydration-plan-cost-mcp",
  "title": "Hydration Plan Budget Audit",
  "description": "Audit hydration plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hydration_plan_budget",
  "entity": "hydration item budget line",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "electrolyte",
      "label": "Electrolyte",
      "baseline": 1
    },
    {
      "id": "bottle",
      "label": "Bottle",
      "baseline": 1
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "electrolyte",
      "label": "Electrolyte",
      "categories": [
        "electrolyte"
      ]
    },
    {
      "id": "bottle",
      "label": "Bottle",
      "categories": [
        "bottle"
      ]
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "categories": [
        "schedule"
      ]
    }
  ],
  "sample": [
    {
      "id": "hydration_plan_budget-water-supply",
      "name": "Water supply",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "hydration_plan_budget-electrolyte-tabs",
      "name": "Electrolyte tabs",
      "category": "electrolyte",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "hydration_plan_budget-water-bottle",
      "name": "Water bottle",
      "category": "bottle",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "hydration_plan_budget-refill-schedule",
      "name": "Refill schedule",
      "category": "schedule",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
