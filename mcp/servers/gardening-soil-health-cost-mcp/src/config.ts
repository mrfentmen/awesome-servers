import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-soil-health-cost-mcp",
  "title": "Soil Health Budget Audit",
  "description": "Audit soil health budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soil_health_budget",
  "entity": "soil input budget line",
  "categories": [
    {
      "id": "bed",
      "label": "Beds",
      "baseline": 3
    },
    {
      "id": "compost",
      "label": "Compost",
      "baseline": 2
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "baseline": 3
    },
    {
      "id": "cover",
      "label": "Cover crops",
      "baseline": 2
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bed",
      "label": "Planting bed",
      "categories": [
        "bed"
      ]
    },
    {
      "id": "compost",
      "label": "Compost",
      "categories": [
        "compost"
      ]
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "categories": [
        "mulch"
      ]
    },
    {
      "id": "cover",
      "label": "Cover crop",
      "categories": [
        "cover"
      ]
    }
  ],
  "sample": [
    {
      "id": "soil_health_budget-vegetable-bed",
      "name": "Vegetable bed",
      "category": "bed",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "soil_health_budget-compost-bin",
      "name": "Compost bin",
      "category": "compost",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "soil_health_budget-straw-mulch",
      "name": "Straw mulch",
      "category": "mulch",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "soil_health_budget-clover-cover-crop",
      "name": "Clover cover crop",
      "category": "cover",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "fair"
    }
  ]
}
