import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-pantry-expiry-cost-mcp",
  "title": "Pantry Expiry Budget Audit",
  "description": "Audit pantry expiry budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pantry_expiry_budget",
  "entity": "pantry item budget line",
  "categories": [
    {
      "id": "grain",
      "label": "Grains",
      "baseline": 4
    },
    {
      "id": "can",
      "label": "Canned goods",
      "baseline": 4
    },
    {
      "id": "fridge",
      "label": "Fridge items",
      "baseline": 4
    },
    {
      "id": "freezer",
      "label": "Freezer items",
      "baseline": 3
    },
    {
      "id": "spice",
      "label": "Spices",
      "baseline": 4
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
    "budget": 50,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Base staple",
      "categories": [
        "grain"
      ]
    },
    {
      "id": "protein",
      "label": "Protein",
      "categories": [
        "can",
        "fridge",
        "freezer"
      ]
    },
    {
      "id": "produce",
      "label": "Produce",
      "categories": [
        "fridge",
        "freezer"
      ]
    },
    {
      "id": "seasoning",
      "label": "Seasoning",
      "categories": [
        "spice"
      ]
    }
  ],
  "sample": [
    {
      "id": "pantry_expiry_budget-jasmine-rice",
      "name": "Jasmine rice",
      "category": "grain",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "new"
    },
    {
      "id": "pantry_expiry_budget-black-beans",
      "name": "Black beans",
      "category": "can",
      "tags": [
        "budget"
      ],
      "cost": 2,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "pantry_expiry_budget-greek-yogurt",
      "name": "Greek yogurt",
      "category": "fridge",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "pantry_expiry_budget-frozen-peas",
      "name": "Frozen peas",
      "category": "freezer",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "pantry_expiry_budget-smoked-paprika",
      "name": "Smoked paprika",
      "category": "spice",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "fair"
    },
    {
      "id": "pantry_expiry_budget-penne-pasta",
      "name": "Penne pasta",
      "category": "grain",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "new"
    }
  ]
}
