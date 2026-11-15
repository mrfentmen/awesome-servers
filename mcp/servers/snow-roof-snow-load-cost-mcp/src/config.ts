import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-roof-snow-load-cost-mcp",
  "title": "Roof Snow Load Budget Audit",
  "description": "Audit roof snow load budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roof_snow_load_budget",
  "entity": "roof check budget line",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "structure",
      "label": "Structure",
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
    "budget": 2600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "roof",
      "label": "Roof",
      "categories": [
        "roof"
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
      "id": "structure",
      "label": "Structure",
      "categories": [
        "structure"
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
      "id": "roof_snow_load_budget-roof-inspection",
      "name": "Roof inspection",
      "category": "roof",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "roof_snow_load_budget-snow-rake",
      "name": "Snow rake",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "roof_snow_load_budget-contractor-clearing",
      "name": "Contractor clearing",
      "category": "structure",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "roof_snow_load_budget-structural-repair-reserve",
      "name": "Structural repair reserve",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "new"
    }
  ]
}
