import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-cooling-cost-check-mcp",
  "title": "Cooling Cost Audit",
  "description": "Audit air conditioning, fans, insulation and thermostat running costs. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cooling_cost",
  "entity": "cooling item",
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
    "id": "monthly_cost",
    "label": "Monthly cost",
    "unit": "USD",
    "target": 150,
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
      "id": "cooling_cost-ac-unit",
      "name": "AC unit",
      "category": "ac",
      "tags": [
        "ac"
      ],
      "cost": 300,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "cooling_cost-ceiling-fan",
      "name": "Ceiling fan",
      "category": "fan",
      "tags": [
        "fan"
      ],
      "cost": 120,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "cooling_cost-attic-insulation",
      "name": "Attic insulation",
      "category": "insulation",
      "tags": [
        "insulation"
      ],
      "cost": 800,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "cooling_cost-smart-thermostat",
      "name": "Smart thermostat",
      "category": "thermostat",
      "tags": [
        "thermostat"
      ],
      "cost": 150,
      "quantity": 10,
      "condition": "new"
    }
  ]
}
