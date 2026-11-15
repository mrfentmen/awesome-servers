import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-passport-expiry-cost-mcp",
  "title": "Passport Expiry Budget Audit",
  "description": "Audit passport expiry budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "passport_expiry_budget",
  "entity": "travel document budget line",
  "categories": [
    {
      "id": "passport",
      "label": "Passports",
      "baseline": 1
    },
    {
      "id": "visa",
      "label": "Visas",
      "baseline": 2
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 2
    },
    {
      "id": "vaccine",
      "label": "Vaccination records",
      "baseline": 2
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
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "identity",
      "label": "Identity document",
      "categories": [
        "passport"
      ]
    },
    {
      "id": "entry",
      "label": "Entry permission",
      "categories": [
        "visa"
      ]
    },
    {
      "id": "health",
      "label": "Health document",
      "categories": [
        "vaccine"
      ]
    }
  ],
  "sample": [
    {
      "id": "passport_expiry_budget-passport",
      "name": "Passport",
      "category": "passport",
      "tags": [
        "budget"
      ],
      "cost": 160,
      "quantity": 160,
      "condition": "good"
    },
    {
      "id": "passport_expiry_budget-tourist-visa",
      "name": "Tourist visa",
      "category": "visa",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "passport_expiry_budget-travel-insurance",
      "name": "Travel insurance",
      "category": "insurance",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "passport_expiry_budget-vaccination-record",
      "name": "Vaccination record",
      "category": "vaccine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "passport_expiry_budget-business-visa",
      "name": "Business visa",
      "category": "visa",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    }
  ]
}
