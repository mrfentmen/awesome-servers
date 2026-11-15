import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-cooling-cost-cost-mcp",
  "title": "Cooling Cost Budget Audit",
  "description": "Audit cooling cost budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cooling_cost_budget",
  "entity": "cooling item budget line",
  "categories": [
    {
      "id": "ac",
      "label": "AC",
      "baseline": 2
    },
    {
      "id": "fan",
      "label": "Fan",
      "baseline": 1
    },
    {
      "id": "insulation",
      "label": "Insulation",
      "baseline": 1
    },
    {
      "id": "thermostat",
      "label": "Thermostat",
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
    "budget": 1650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "ac",
      "label": "AC",
      "categories": [
        "ac"
      ]
    },
    {
      "id": "fan",
      "label": "Fan",
      "categories": [
        "fan"
      ]
    },
    {
      "id": "insulation",
      "label": "Insulation",
      "categories": [
        "insulation"
      ]
    },
    {
      "id": "thermostat",
      "label": "Thermostat",
      "categories": [
        "thermostat"
      ]
    }
  ],
  "sample": [
    {
      "id": "cooling_cost_budget-ac-service",
      "name": "AC service",
      "category": "ac",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "cooling_cost_budget-ceiling-fan",
      "name": "Ceiling fan",
      "category": "fan",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "cooling_cost_budget-attic-insulation",
      "name": "Attic insulation",
      "category": "insulation",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "new"
    },
    {
      "id": "cooling_cost_budget-smart-thermostat",
      "name": "Smart thermostat",
      "category": "thermostat",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    }
  ]
}
