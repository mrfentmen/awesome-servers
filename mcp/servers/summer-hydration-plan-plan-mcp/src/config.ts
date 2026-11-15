import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-hydration-plan-plan-mcp",
  "title": "Hydration Plan Planning Audit",
  "description": "Plan hydration plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hydration_plan_plan",
  "entity": "hydration item plan",
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
    "id": "water_ounces",
    "label": "Water ounces",
    "unit": "oz",
    "target": 64,
    "direction": "higher"
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
      "id": "hydration_plan_plan-water-supply",
      "name": "Water supply",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 20,
      "quantity": 64,
      "condition": "good"
    },
    {
      "id": "hydration_plan_plan-electrolyte-tabs",
      "name": "Electrolyte tabs",
      "category": "electrolyte",
      "tags": [
        "electrolyte"
      ],
      "cost": 15,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "hydration_plan_plan-water-bottle",
      "name": "Water bottle",
      "category": "bottle",
      "tags": [
        "bottle"
      ],
      "cost": 25,
      "quantity": 32,
      "condition": "good"
    },
    {
      "id": "hydration_plan_plan-refill-schedule",
      "name": "Refill schedule",
      "category": "schedule",
      "tags": [
        "schedule"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
