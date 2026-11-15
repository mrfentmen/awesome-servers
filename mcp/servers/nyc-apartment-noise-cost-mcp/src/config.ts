import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-apartment-noise-cost-mcp",
  "title": "Apartment Noise Budget Audit",
  "description": "Audit apartment noise budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "apartment_noise_budget",
  "entity": "noise reading budget line",
  "categories": [
    {
      "id": "street",
      "label": "Street",
      "baseline": 2
    },
    {
      "id": "neighbor",
      "label": "Neighbor",
      "baseline": 1
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 1
    },
    {
      "id": "night",
      "label": "Night",
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
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "street",
      "label": "Street",
      "categories": [
        "street"
      ]
    },
    {
      "id": "neighbor",
      "label": "Neighbor",
      "categories": [
        "neighbor"
      ]
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "categories": [
        "hvac"
      ]
    },
    {
      "id": "night",
      "label": "Night",
      "categories": [
        "night"
      ]
    }
  ],
  "sample": [
    {
      "id": "apartment_noise_budget_budget-door-seal",
      "name": "Door seal",
      "category": "street",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "apartment_noise_budget_budget-window-insert",
      "name": "Window insert",
      "category": "neighbor",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "apartment_noise_budget_budget-hvac-service",
      "name": "HVAC service",
      "category": "hvac",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "new"
    },
    {
      "id": "apartment_noise_budget_budget-white-noise-machine",
      "name": "White noise machine",
      "category": "night",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    }
  ]
}
