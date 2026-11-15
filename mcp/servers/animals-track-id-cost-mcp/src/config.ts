import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-track-id-cost-mcp",
  "title": "Wildlife Track ID Budget Audit",
  "description": "Audit wildlife track id budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "track_id_budget",
  "entity": "track budget line",
  "categories": [
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "gait",
      "label": "Gait",
      "baseline": 1
    },
    {
      "id": "substrate",
      "label": "Substrate",
      "baseline": 1
    },
    {
      "id": "guides",
      "label": "Guides",
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
      "id": "photos",
      "label": "Photos",
      "categories": [
        "photos"
      ]
    },
    {
      "id": "gait",
      "label": "Gait",
      "categories": [
        "gait"
      ]
    },
    {
      "id": "substrate",
      "label": "Substrate",
      "categories": [
        "substrate"
      ]
    },
    {
      "id": "guides",
      "label": "Guides",
      "categories": [
        "guides"
      ]
    }
  ],
  "sample": [
    {
      "id": "track_id_budget_budget-track-guide",
      "name": "Track guide",
      "category": "photos",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "track_id_budget_budget-measuring-tape",
      "name": "Measuring tape",
      "category": "gait",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "new"
    },
    {
      "id": "track_id_budget_budget-trail-camera",
      "name": "Trail camera",
      "category": "substrate",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "track_id_budget_budget-print-kit",
      "name": "Print kit",
      "category": "guides",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    }
  ]
}
