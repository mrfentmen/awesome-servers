import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-landslide-risk-cost-mcp",
  "title": "Landslide Risk Budget Audit",
  "description": "Audit landslide risk budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "landslide_risk_budget",
  "entity": "slope item budget line",
  "categories": [
    {
      "id": "slope",
      "label": "Slope",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water",
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
    "budget": 1300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "slope",
      "label": "Slope",
      "categories": [
        "slope"
      ]
    },
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
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
      "id": "landslide_risk_budget-slope-survey",
      "name": "Slope survey",
      "category": "slope",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "landslide_risk_budget-drainage-repair",
      "name": "Drainage repair",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "landslide_risk_budget-native-planting",
      "name": "Native planting",
      "category": "vegetation",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "landslide_risk_budget-access-plan",
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
