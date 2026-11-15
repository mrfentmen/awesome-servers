import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-burn-scar-cost-mcp",
  "title": "Burn Scar Budget Audit",
  "description": "Audit burn scar budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "burn_scar_budget",
  "entity": "burn scar item budget line",
  "categories": [
    {
      "id": "soil",
      "label": "Soil",
      "baseline": 2
    },
    {
      "id": "seed",
      "label": "Seed",
      "baseline": 1
    },
    {
      "id": "mulch",
      "label": "Mulch",
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
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "soil",
      "label": "Soil",
      "categories": [
        "soil"
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "categories": [
        "seed"
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
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    }
  ],
  "sample": [
    {
      "id": "burn_scar_budget-soil-assessment",
      "name": "Soil assessment",
      "category": "soil",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "burn_scar_budget-native-seed",
      "name": "Native seed",
      "category": "seed",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "burn_scar_budget-straw-mulch",
      "name": "Straw mulch",
      "category": "mulch",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "burn_scar_budget-water-bar",
      "name": "Water bar",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    }
  ]
}
