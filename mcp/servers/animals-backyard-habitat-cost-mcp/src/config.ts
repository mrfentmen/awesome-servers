import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-backyard-habitat-cost-mcp",
  "title": "Backyard Habitat Budget Audit",
  "description": "Audit backyard habitat budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "backyard_habitat_budget",
  "entity": "habitat feature budget line",
  "categories": [
    {
      "id": "plants",
      "label": "Plants",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    },
    {
      "id": "shelter",
      "label": "Shelter",
      "baseline": 1
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "plants",
      "label": "Plants",
      "categories": [
        "plants"
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
      "id": "shelter",
      "label": "Shelter",
      "categories": [
        "shelter"
      ]
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "categories": [
        "pesticide"
      ]
    }
  ],
  "sample": [
    {
      "id": "backyard_habitat_budget_budget-native-plants",
      "name": "Native plants",
      "category": "plants",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "backyard_habitat_budget_budget-bird-bath",
      "name": "Bird bath",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "backyard_habitat_budget_budget-brush-pile",
      "name": "Brush pile",
      "category": "shelter",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "backyard_habitat_budget_budget-pesticide-test",
      "name": "Pesticide test",
      "category": "pesticide",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
