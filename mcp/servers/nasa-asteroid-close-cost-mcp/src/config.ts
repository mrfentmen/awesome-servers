import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-asteroid-close-cost-mcp",
  "title": "Asteroid Close Approach Budget Audit",
  "description": "Audit asteroid close approach budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "asteroid_close_budget",
  "entity": "close approach budget line",
  "categories": [
    {
      "id": "date",
      "label": "Date",
      "baseline": 2
    },
    {
      "id": "distance",
      "label": "Distance",
      "baseline": 1
    },
    {
      "id": "size",
      "label": "Size",
      "baseline": 1
    },
    {
      "id": "observation",
      "label": "Observation",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "date",
      "label": "Date",
      "categories": [
        "date"
      ]
    },
    {
      "id": "distance",
      "label": "Distance",
      "categories": [
        "distance"
      ]
    },
    {
      "id": "size",
      "label": "Size",
      "categories": [
        "size"
      ]
    },
    {
      "id": "observation",
      "label": "Observation",
      "categories": [
        "observation"
      ]
    }
  ],
  "sample": [
    {
      "id": "asteroid_close_budget_budget-telescope-time",
      "name": "Telescope time",
      "category": "date",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "asteroid_close_budget_budget-tracking-software",
      "name": "Tracking software",
      "category": "distance",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "asteroid_close_budget_budget-travel",
      "name": "Travel",
      "category": "size",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "asteroid_close_budget_budget-camera-adapter",
      "name": "Camera adapter",
      "category": "observation",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    }
  ]
}
