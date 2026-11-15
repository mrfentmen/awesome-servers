import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-heat-index-cost-mcp",
  "title": "Heat Index Budget Audit",
  "description": "Audit heat index budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "heat_index_budget",
  "entity": "heat check budget line",
  "categories": [
    {
      "id": "indoor",
      "label": "Indoor",
      "baseline": 2
    },
    {
      "id": "outdoor",
      "label": "Outdoor",
      "baseline": 1
    },
    {
      "id": "shade",
      "label": "Shade",
      "baseline": 1
    },
    {
      "id": "water",
      "label": "Water",
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
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "indoor",
      "label": "Indoor",
      "categories": [
        "indoor"
      ]
    },
    {
      "id": "outdoor",
      "label": "Outdoor",
      "categories": [
        "outdoor"
      ]
    },
    {
      "id": "shade",
      "label": "Shade",
      "categories": [
        "shade"
      ]
    },
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    }
  ],
  "sample": [
    {
      "id": "heat_index_budget-indoor-cooling",
      "name": "Indoor cooling",
      "category": "indoor",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "heat_index_budget-outdoor-misting",
      "name": "Outdoor misting",
      "category": "outdoor",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "heat_index_budget-shade-sail",
      "name": "Shade sail",
      "category": "shade",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "heat_index_budget-water-station",
      "name": "Water station",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
