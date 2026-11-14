import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-grocery-budget-check-mcp",
  "title": "Grocery Budget Audit",
  "description": "Audit grocery items by category, price, expiry and budget coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "grocery_budget",
  "entity": "grocery item",
  "categories": [
    {
      "id": "produce",
      "label": "Produce",
      "baseline": 3
    },
    {
      "id": "protein",
      "label": "Protein",
      "baseline": 3
    },
    {
      "id": "pantry",
      "label": "Pantry",
      "baseline": 3
    },
    {
      "id": "dairy",
      "label": "Dairy",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Item price",
    "unit": "USD",
    "target": 10,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
    "coverage": 0.75,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "produce",
      "label": "Produce",
      "categories": [
        "produce"
      ]
    },
    {
      "id": "protein",
      "label": "Protein",
      "categories": [
        "protein"
      ]
    },
    {
      "id": "pantry",
      "label": "Pantry",
      "categories": [
        "pantry"
      ]
    },
    {
      "id": "dairy",
      "label": "Dairy",
      "categories": [
        "dairy"
      ]
    }
  ],
  "sample": [
    {
      "id": "grocery-apples",
      "name": "Apples",
      "category": "produce",
      "tags": [
        "fresh"
      ],
      "cost": 4,
      "quantity": 4,
      "expires": "2026-11-25",
      "condition": "good"
    },
    {
      "id": "grocery-chicken",
      "name": "Chicken breast",
      "category": "protein",
      "tags": [
        "fresh"
      ],
      "cost": 12,
      "quantity": 12,
      "expires": "2026-11-18",
      "condition": "good"
    },
    {
      "id": "grocery-rice",
      "name": "Rice bag",
      "category": "pantry",
      "tags": [
        "staple"
      ],
      "cost": 3,
      "quantity": 3,
      "expires": "2027-12-01",
      "condition": "new"
    },
    {
      "id": "grocery-yogurt",
      "name": "Greek yogurt",
      "category": "dairy",
      "tags": [
        "chilled"
      ],
      "cost": 6,
      "quantity": 6,
      "expires": "2026-11-22",
      "condition": "good"
    }
  ]
}
