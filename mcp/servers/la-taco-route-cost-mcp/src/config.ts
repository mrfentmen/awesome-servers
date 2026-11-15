import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-taco-route-cost-mcp",
  "title": "Taco Route Budget Audit",
  "description": "Audit taco route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "taco_route_budget",
  "entity": "taco stop budget line",
  "categories": [
    {
      "id": "stops",
      "label": "Stops",
      "baseline": 2
    },
    {
      "id": "walk",
      "label": "Walk",
      "baseline": 1
    },
    {
      "id": "price",
      "label": "Price",
      "baseline": 1
    },
    {
      "id": "hours",
      "label": "Hours",
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
      "id": "stops",
      "label": "Stops",
      "categories": [
        "stops"
      ]
    },
    {
      "id": "walk",
      "label": "Walk",
      "categories": [
        "walk"
      ]
    },
    {
      "id": "price",
      "label": "Price",
      "categories": [
        "price"
      ]
    },
    {
      "id": "hours",
      "label": "Hours",
      "categories": [
        "hours"
      ]
    }
  ],
  "sample": [
    {
      "id": "taco_route_budget_budget-tacos",
      "name": "Tacos",
      "category": "stops",
      "tags": [
        "budget"
      ],
      "cost": 27,
      "quantity": 27,
      "condition": "new"
    },
    {
      "id": "taco_route_budget_budget-drinks",
      "name": "Drinks",
      "category": "walk",
      "tags": [
        "budget"
      ],
      "cost": 9,
      "quantity": 9,
      "condition": "new"
    },
    {
      "id": "taco_route_budget_budget-parking",
      "name": "Parking",
      "category": "price",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "taco_route_budget_budget-route-map",
      "name": "Route map",
      "category": "hours",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
