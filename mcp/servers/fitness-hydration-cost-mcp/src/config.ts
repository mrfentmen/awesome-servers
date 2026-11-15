import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-hydration-cost-mcp",
  "title": "Hydration Budget Audit",
  "description": "Audit hydration budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hydration_budget",
  "entity": "hydration item budget line",
  "categories": [
    {
      "id": "bottle",
      "label": "Bottles",
      "baseline": 2
    },
    {
      "id": "powder",
      "label": "Powders",
      "baseline": 2
    },
    {
      "id": "electrolyte",
      "label": "Electrolytes",
      "baseline": 2
    },
    {
      "id": "mug",
      "label": "Mugs",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bottle",
      "label": "Reusable bottle",
      "categories": [
        "bottle"
      ]
    },
    {
      "id": "mix",
      "label": "Hydration mix",
      "categories": [
        "powder",
        "electrolyte"
      ]
    }
  ],
  "sample": [
    {
      "id": "hydration_budget-insulated-bottle",
      "name": "Insulated bottle",
      "category": "bottle",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "hydration_budget-electrolyte-powder",
      "name": "Electrolyte powder",
      "category": "powder",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "hydration_budget-electrolyte-tablets",
      "name": "Electrolyte tablets",
      "category": "electrolyte",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "new"
    },
    {
      "id": "hydration_budget-travel-mug",
      "name": "Travel mug",
      "category": "mug",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "hydration_budget-gym-bottle",
      "name": "Gym bottle",
      "category": "bottle",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    }
  ]
}
