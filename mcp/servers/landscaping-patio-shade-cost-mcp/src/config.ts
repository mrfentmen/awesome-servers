import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-patio-shade-cost-mcp",
  "title": "Patio Shade Budget Audit",
  "description": "Audit patio shade budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "patio_shade_budget",
  "entity": "shade element budget line",
  "categories": [
    {
      "id": "tree",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "pergola",
      "label": "Pergolas",
      "baseline": 1
    },
    {
      "id": "sail",
      "label": "Shade sails",
      "baseline": 1
    },
    {
      "id": "umbrella",
      "label": "Umbrellas",
      "baseline": 1
    },
    {
      "id": "vine",
      "label": "Vines",
      "baseline": 1
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
    "budget": 2350,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "overhead",
      "label": "Overhead structure",
      "categories": [
        "pergola",
        "sail",
        "umbrella"
      ]
    },
    {
      "id": "natural",
      "label": "Natural shade",
      "categories": [
        "tree",
        "vine"
      ]
    }
  ],
  "sample": [
    {
      "id": "patio_shade_budget-oak-tree",
      "name": "Oak tree",
      "category": "tree",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "good"
    },
    {
      "id": "patio_shade_budget-timber-pergola",
      "name": "Timber pergola",
      "category": "pergola",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "good"
    },
    {
      "id": "patio_shade_budget-shade-sail",
      "name": "Shade sail",
      "category": "sail",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "patio_shade_budget-patio-umbrella",
      "name": "Patio umbrella",
      "category": "umbrella",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "patio_shade_budget-climbing-vine",
      "name": "Climbing vine",
      "category": "vine",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "patio_shade_budget-second-sail",
      "name": "Second sail",
      "category": "sail",
      "tags": [
        "budget"
      ],
      "cost": 160,
      "quantity": 160,
      "condition": "good"
    }
  ]
}
