import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-basement-damp-cost-mcp",
  "title": "Basement Damp Budget Audit",
  "description": "Audit basement damp budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basement_damp_budget",
  "entity": "damp item budget line",
  "categories": [
    {
      "id": "wall",
      "label": "Wall",
      "baseline": 2
    },
    {
      "id": "floor",
      "label": "Floor",
      "baseline": 1
    },
    {
      "id": "dehumidifier",
      "label": "Dehumidifier",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
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
    "budget": 900,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wall",
      "label": "Wall",
      "categories": [
        "wall"
      ]
    },
    {
      "id": "floor",
      "label": "Floor",
      "categories": [
        "floor"
      ]
    },
    {
      "id": "dehumidifier",
      "label": "Dehumidifier",
      "categories": [
        "dehumidifier"
      ]
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    }
  ],
  "sample": [
    {
      "id": "basement_damp_budget-wall-sealant",
      "name": "Wall sealant",
      "category": "wall",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "basement_damp_budget-floor-crack-repair",
      "name": "Floor crack repair",
      "category": "floor",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "basement_damp_budget-dehumidifier",
      "name": "Dehumidifier",
      "category": "dehumidifier",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "basement_damp_budget-sump-pump",
      "name": "Sump pump",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    }
  ]
}
