import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-film-permit-cost-mcp",
  "title": "Film Permit Budget Audit",
  "description": "Audit film permit budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "film_permit_budget",
  "entity": "permit item budget line",
  "categories": [
    {
      "id": "permit",
      "label": "Permit",
      "baseline": 2
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 1
    },
    {
      "id": "parking",
      "label": "Parking",
      "baseline": 1
    },
    {
      "id": "insurance",
      "label": "Insurance",
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
    "budget": 3150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "permit",
      "label": "Permit",
      "categories": [
        "permit"
      ]
    },
    {
      "id": "location",
      "label": "Location",
      "categories": [
        "location"
      ]
    },
    {
      "id": "parking",
      "label": "Parking",
      "categories": [
        "parking"
      ]
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "categories": [
        "insurance"
      ]
    }
  ],
  "sample": [
    {
      "id": "film_permit_budget_budget-permit-fee",
      "name": "Permit fee",
      "category": "permit",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "film_permit_budget_budget-location-fee",
      "name": "Location fee",
      "category": "location",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "new"
    },
    {
      "id": "film_permit_budget_budget-parking",
      "name": "Parking",
      "category": "parking",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "film_permit_budget_budget-insurance",
      "name": "Insurance",
      "category": "insurance",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    }
  ]
}
