import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-maintenance-cost-mcp",
  "title": "Car Maintenance Budget Audit",
  "description": "Audit car maintenance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_maintenance_budget",
  "entity": "maintenance item budget line",
  "categories": [
    {
      "id": "oil",
      "label": "Oil",
      "baseline": 1
    },
    {
      "id": "tires",
      "label": "Tires",
      "baseline": 2
    },
    {
      "id": "brakes",
      "label": "Brakes",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filters",
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
    "budget": 950,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "oil",
      "label": "Oil service",
      "categories": [
        "oil"
      ]
    },
    {
      "id": "tires",
      "label": "Tire service",
      "categories": [
        "tires"
      ]
    },
    {
      "id": "brakes",
      "label": "Brake service",
      "categories": [
        "brakes"
      ]
    },
    {
      "id": "filter",
      "label": "Filter service",
      "categories": [
        "filter"
      ]
    }
  ],
  "sample": [
    {
      "id": "car_maintenance_budget-engine-oil",
      "name": "Engine oil",
      "category": "oil",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "car_maintenance_budget-all-season-tires",
      "name": "All-season tires",
      "category": "tires",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "fair"
    },
    {
      "id": "car_maintenance_budget-front-brake-pads",
      "name": "Front brake pads",
      "category": "brakes",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "fair"
    },
    {
      "id": "car_maintenance_budget-cabin-filter",
      "name": "Cabin filter",
      "category": "filter",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
