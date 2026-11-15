import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-commute-rain-cost-mcp",
  "title": "Commute Rain Budget Audit",
  "description": "Audit commute rain budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "commute_rain_budget",
  "entity": "rain commute item budget line",
  "categories": [
    {
      "id": "coat",
      "label": "Coat",
      "baseline": 2
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 1
    },
    {
      "id": "bag",
      "label": "Bag",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
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
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "coat",
      "label": "Coat",
      "categories": [
        "coat"
      ]
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "categories": [
        "shoes"
      ]
    },
    {
      "id": "bag",
      "label": "Bag",
      "categories": [
        "bag"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    }
  ],
  "sample": [
    {
      "id": "commute_rain_budget-rain-shell",
      "name": "Rain shell",
      "category": "coat",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "commute_rain_budget-waterproof-shoes",
      "name": "Waterproof shoes",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "commute_rain_budget-dry-bag",
      "name": "Dry bag",
      "category": "bag",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "commute_rain_budget-route-planning",
      "name": "Route planning",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
