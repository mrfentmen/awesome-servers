import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-amphibian-pond-cost-mcp",
  "title": "Amphibian Pond Budget Audit",
  "description": "Audit amphibian pond budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "amphibian_pond_budget",
  "entity": "pond feature budget line",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "cover",
      "label": "Cover",
      "baseline": 1
    },
    {
      "id": "breeding",
      "label": "Breeding",
      "baseline": 1
    },
    {
      "id": "predators",
      "label": "Predators",
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
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "cover",
      "label": "Cover",
      "categories": [
        "cover"
      ]
    },
    {
      "id": "breeding",
      "label": "Breeding",
      "categories": [
        "breeding"
      ]
    },
    {
      "id": "predators",
      "label": "Predators",
      "categories": [
        "predators"
      ]
    }
  ],
  "sample": [
    {
      "id": "amphibian_pond_budget_budget-liner",
      "name": "Liner",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "amphibian_pond_budget_budget-native-plants",
      "name": "Native plants",
      "category": "cover",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "amphibian_pond_budget_budget-water-test",
      "name": "Water test",
      "category": "breeding",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "amphibian_pond_budget_budget-predator-screen",
      "name": "Predator screen",
      "category": "predators",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    }
  ]
}
