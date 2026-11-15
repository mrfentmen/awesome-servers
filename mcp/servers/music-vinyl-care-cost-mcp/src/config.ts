import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-vinyl-care-cost-mcp",
  "title": "Vinyl Care Budget Audit",
  "description": "Audit vinyl care budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "vinyl_care_budget",
  "entity": "vinyl item budget line",
  "categories": [
    {
      "id": "record",
      "label": "Records",
      "baseline": 3
    },
    {
      "id": "sleeve",
      "label": "Sleeves",
      "baseline": 2
    },
    {
      "id": "brush",
      "label": "Brushes",
      "baseline": 1
    },
    {
      "id": "stylus",
      "label": "Styli",
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
      "id": "record",
      "label": "Record",
      "categories": [
        "record"
      ]
    },
    {
      "id": "sleeve",
      "label": "Sleeve",
      "categories": [
        "sleeve"
      ]
    },
    {
      "id": "brush",
      "label": "Brush",
      "categories": [
        "brush"
      ]
    },
    {
      "id": "stylus",
      "label": "Stylus",
      "categories": [
        "stylus"
      ]
    }
  ],
  "sample": [
    {
      "id": "vinyl_care_budget-vintage-lp",
      "name": "Vintage LP",
      "category": "record",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "vinyl_care_budget-inner-sleeve",
      "name": "Inner sleeve",
      "category": "sleeve",
      "tags": [
        "budget"
      ],
      "cost": 2,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "vinyl_care_budget-carbon-brush",
      "name": "Carbon brush",
      "category": "brush",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "vinyl_care_budget-replacement-stylus",
      "name": "Replacement stylus",
      "category": "stylus",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    }
  ]
}
