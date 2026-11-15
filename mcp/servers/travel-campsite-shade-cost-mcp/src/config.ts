import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-campsite-shade-cost-mcp",
  "title": "Campsite Shade Budget Audit",
  "description": "Audit campsite shade budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "campsite_shade_budget",
  "entity": "campsite budget line",
  "categories": [
    {
      "id": "shaded",
      "label": "Shaded sites",
      "baseline": 2
    },
    {
      "id": "partial",
      "label": "Partial shade",
      "baseline": 3
    },
    {
      "id": "sunny",
      "label": "Sunny sites",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water access",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "shaded",
      "label": "Shaded site",
      "categories": [
        "shaded"
      ]
    },
    {
      "id": "partial",
      "label": "Partial shade",
      "categories": [
        "partial"
      ]
    },
    {
      "id": "water",
      "label": "Water access",
      "categories": [
        "water"
      ]
    }
  ],
  "sample": [
    {
      "id": "campsite_shade_budget-oak-flat",
      "name": "Oak flat",
      "category": "shaded",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "campsite_shade_budget-pine-ridge",
      "name": "Pine ridge",
      "category": "partial",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "campsite_shade_budget-lake-beach",
      "name": "Lake beach",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "fair"
    },
    {
      "id": "campsite_shade_budget-canyon-site",
      "name": "Canyon site",
      "category": "sunny",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "fair"
    }
  ]
}
