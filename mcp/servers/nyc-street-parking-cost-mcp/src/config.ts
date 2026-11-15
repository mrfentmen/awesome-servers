import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-street-parking-cost-mcp",
  "title": "Street Parking Budget Audit",
  "description": "Audit street parking budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "street_parking_budget",
  "entity": "parking block budget line",
  "categories": [
    {
      "id": "signs",
      "label": "Signs",
      "baseline": 2
    },
    {
      "id": "meters",
      "label": "Meters",
      "baseline": 1
    },
    {
      "id": "sweep",
      "label": "Sweep",
      "baseline": 1
    },
    {
      "id": "garage",
      "label": "Garage",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "signs",
      "label": "Signs",
      "categories": [
        "signs"
      ]
    },
    {
      "id": "meters",
      "label": "Meters",
      "categories": [
        "meters"
      ]
    },
    {
      "id": "sweep",
      "label": "Sweep",
      "categories": [
        "sweep"
      ]
    },
    {
      "id": "garage",
      "label": "Garage",
      "categories": [
        "garage"
      ]
    }
  ],
  "sample": [
    {
      "id": "street_parking_budget_budget-sign-survey",
      "name": "Sign survey",
      "category": "signs",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "street_parking_budget_budget-meter-app",
      "name": "Meter app",
      "category": "meters",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "street_parking_budget_budget-sweep-reminder",
      "name": "Sweep reminder",
      "category": "sweep",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "street_parking_budget_budget-garage-reserve",
      "name": "Garage reserve",
      "category": "garage",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    }
  ]
}
