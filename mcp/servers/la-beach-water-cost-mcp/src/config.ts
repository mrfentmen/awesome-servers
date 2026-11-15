import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-beach-water-cost-mcp",
  "title": "Beach Water Budget Audit",
  "description": "Audit beach water budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "beach_water_budget",
  "entity": "beach sample budget line",
  "categories": [
    {
      "id": "bacteria",
      "label": "Bacteria",
      "baseline": 2
    },
    {
      "id": "closure",
      "label": "Closure",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 1
    },
    {
      "id": "testing",
      "label": "Testing",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bacteria",
      "label": "Bacteria",
      "categories": [
        "bacteria"
      ]
    },
    {
      "id": "closure",
      "label": "Closure",
      "categories": [
        "closure"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "testing",
      "label": "Testing",
      "categories": [
        "testing"
      ]
    }
  ],
  "sample": [
    {
      "id": "beach_water_budget_budget-water-test-kit",
      "name": "Water test kit",
      "category": "bacteria",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "beach_water_budget_budget-beach-parking",
      "name": "Beach parking",
      "category": "closure",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "beach_water_budget_budget-rinse-station",
      "name": "Rinse station",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "beach_water_budget_budget-closure-alert",
      "name": "Closure alert",
      "category": "testing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
