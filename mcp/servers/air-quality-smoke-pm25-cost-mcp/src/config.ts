import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-smoke-pm25-cost-mcp",
  "title": "Wildfire Smoke PM2.5 Budget Audit",
  "description": "Audit wildfire smoke pm2.5 budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "smoke_pm25_budget",
  "entity": "smoke reading budget line",
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
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "seal",
      "label": "Seal",
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
      "id": "filter",
      "label": "Filter",
      "categories": [
        "filter"
      ]
    },
    {
      "id": "seal",
      "label": "Seal",
      "categories": [
        "seal"
      ]
    }
  ],
  "sample": [
    {
      "id": "smoke_pm25_budget-indoor-air-monitor",
      "name": "Indoor air monitor",
      "category": "indoor",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "smoke_pm25_budget-outdoor-sensor",
      "name": "Outdoor sensor",
      "category": "outdoor",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "smoke_pm25_budget-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "smoke_pm25_budget-door-seal",
      "name": "Door seal",
      "category": "seal",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
