import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-rain-garden-cost-mcp",
  "title": "Rain Garden Budget Audit",
  "description": "Audit rain garden budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rain_garden_budget",
  "entity": "rain garden item budget line",
  "categories": [
    {
      "id": "basin",
      "label": "Basin",
      "baseline": 2
    },
    {
      "id": "soil",
      "label": "Soil",
      "baseline": 1
    },
    {
      "id": "plants",
      "label": "Plants",
      "baseline": 1
    },
    {
      "id": "overflow",
      "label": "Overflow",
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
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "basin",
      "label": "Basin",
      "categories": [
        "basin"
      ]
    },
    {
      "id": "soil",
      "label": "Soil",
      "categories": [
        "soil"
      ]
    },
    {
      "id": "plants",
      "label": "Plants",
      "categories": [
        "plants"
      ]
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "categories": [
        "overflow"
      ]
    }
  ],
  "sample": [
    {
      "id": "rain_garden_budget-basin-excavation",
      "name": "Basin excavation",
      "category": "basin",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "rain_garden_budget-compost",
      "name": "Compost",
      "category": "soil",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "rain_garden_budget-native-plants",
      "name": "Native plants",
      "category": "plants",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "rain_garden_budget-overflow-channel",
      "name": "Overflow channel",
      "category": "overflow",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    }
  ]
}
