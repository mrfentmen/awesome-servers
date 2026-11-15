import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-microclimate-cost-mcp",
  "title": "Microclimate Budget Audit",
  "description": "Audit microclimate budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "microclimate_budget",
  "entity": "microclimate reading budget line",
  "categories": [
    {
      "id": "north",
      "label": "North",
      "baseline": 2
    },
    {
      "id": "south",
      "label": "South",
      "baseline": 1
    },
    {
      "id": "east",
      "label": "East",
      "baseline": 1
    },
    {
      "id": "west",
      "label": "West",
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
      "id": "north",
      "label": "North",
      "categories": [
        "north"
      ]
    },
    {
      "id": "south",
      "label": "South",
      "categories": [
        "south"
      ]
    },
    {
      "id": "east",
      "label": "East",
      "categories": [
        "east"
      ]
    },
    {
      "id": "west",
      "label": "West",
      "categories": [
        "west"
      ]
    }
  ],
  "sample": [
    {
      "id": "microclimate_budget-north-sensor",
      "name": "North sensor",
      "category": "north",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "microclimate_budget-south-sensor",
      "name": "South sensor",
      "category": "south",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "microclimate_budget-east-sensor",
      "name": "East sensor",
      "category": "east",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "microclimate_budget-west-sensor",
      "name": "West sensor",
      "category": "west",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
