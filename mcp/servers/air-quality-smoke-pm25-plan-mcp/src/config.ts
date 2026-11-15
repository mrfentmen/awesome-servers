import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-smoke-pm25-plan-mcp",
  "title": "Wildfire Smoke PM2.5 Planning Audit",
  "description": "Plan wildfire smoke pm2.5 by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "smoke_pm25_plan",
  "entity": "smoke reading plan",
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
    "id": "pm25",
    "label": "PM2.5",
    "unit": "µg/m³",
    "target": 35,
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
      "id": "smoke_pm25_plan-living-room-air",
      "name": "Living room air",
      "category": "indoor",
      "tags": [
        "indoor"
      ],
      "cost": 0,
      "quantity": 65,
      "condition": "fair"
    },
    {
      "id": "smoke_pm25_plan-backyard-air",
      "name": "Backyard air",
      "category": "outdoor",
      "tags": [
        "outdoor"
      ],
      "cost": 0,
      "quantity": 120,
      "condition": "worn"
    },
    {
      "id": "smoke_pm25_plan-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "filter"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "smoke_pm25_plan-door-seal",
      "name": "Door seal",
      "category": "seal",
      "tags": [
        "seal"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
