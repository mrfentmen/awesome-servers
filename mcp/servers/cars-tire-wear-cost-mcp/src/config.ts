import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-tire-wear-cost-mcp",
  "title": "Tire Wear Budget Audit",
  "description": "Audit tire wear budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tire_wear_budget",
  "entity": "tire budget line",
  "categories": [
    {
      "id": "front",
      "label": "Front tires",
      "baseline": 2
    },
    {
      "id": "rear",
      "label": "Rear tires",
      "baseline": 2
    },
    {
      "id": "spare",
      "label": "Spare",
      "baseline": 1
    },
    {
      "id": "winter",
      "label": "Winter tires",
      "baseline": 2
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
    "budget": 900,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "front",
      "label": "Front axle",
      "categories": [
        "front"
      ]
    },
    {
      "id": "rear",
      "label": "Rear axle",
      "categories": [
        "rear"
      ]
    },
    {
      "id": "spare",
      "label": "Spare",
      "categories": [
        "spare"
      ]
    },
    {
      "id": "winter",
      "label": "Winter set",
      "categories": [
        "winter"
      ]
    }
  ],
  "sample": [
    {
      "id": "tire_wear_budget-front-left",
      "name": "Front left",
      "category": "front",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "tire_wear_budget-rear-right",
      "name": "Rear right",
      "category": "rear",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    },
    {
      "id": "tire_wear_budget-spare-tire",
      "name": "Spare tire",
      "category": "spare",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "tire_wear_budget-winter-set",
      "name": "Winter set",
      "category": "winter",
      "tags": [
        "budget"
      ],
      "cost": 400,
      "quantity": 400,
      "condition": "worn"
    }
  ]
}
