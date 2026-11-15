import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-winter-travel-cost-mcp",
  "title": "Winter Travel Budget Audit",
  "description": "Audit winter travel budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "winter_travel_budget",
  "entity": "winter travel item budget line",
  "categories": [
    {
      "id": "vehicle",
      "label": "Vehicle",
      "baseline": 2
    },
    {
      "id": "emergency",
      "label": "Emergency",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "clothing",
      "label": "Clothing",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "vehicle",
      "label": "Vehicle",
      "categories": [
        "vehicle"
      ]
    },
    {
      "id": "emergency",
      "label": "Emergency",
      "categories": [
        "emergency"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "clothing",
      "label": "Clothing",
      "categories": [
        "clothing"
      ]
    }
  ],
  "sample": [
    {
      "id": "winter_travel_budget-winter-tires",
      "name": "Winter tires",
      "category": "vehicle",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "winter_travel_budget-emergency-kit",
      "name": "Emergency kit",
      "category": "emergency",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "winter_travel_budget-route-planning",
      "name": "Route planning",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "winter_travel_budget-cold-weather-clothing",
      "name": "Cold-weather clothing",
      "category": "clothing",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    }
  ]
}
