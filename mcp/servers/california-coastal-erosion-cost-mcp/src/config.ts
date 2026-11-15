import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-coastal-erosion-cost-mcp",
  "title": "Coastal Erosion Budget Audit",
  "description": "Audit coastal erosion budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "coastal_erosion_budget",
  "entity": "coastal item budget line",
  "categories": [
    {
      "id": "bluff",
      "label": "Bluff",
      "baseline": 2
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "vegetation",
      "label": "Vegetation",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
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
    "budget": 1150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bluff",
      "label": "Bluff",
      "categories": [
        "bluff"
      ]
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    },
    {
      "id": "vegetation",
      "label": "Vegetation",
      "categories": [
        "vegetation"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    }
  ],
  "sample": [
    {
      "id": "coastal_erosion_budget-bluff-survey",
      "name": "Bluff survey",
      "category": "bluff",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "coastal_erosion_budget-drainage-repair",
      "name": "Drainage repair",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "coastal_erosion_budget-native-plants",
      "name": "Native plants",
      "category": "vegetation",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "coastal_erosion_budget-access-plan",
      "name": "Access plan",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
