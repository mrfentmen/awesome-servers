import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-store-stock-cost-mcp",
  "title": "Pet Store Stock Budget Audit",
  "description": "Audit pet store stock budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "store_stock_budget",
  "entity": "stock item budget line",
  "categories": [
    {
      "id": "food",
      "label": "Food",
      "baseline": 3
    },
    {
      "id": "treats",
      "label": "Treats",
      "baseline": 2
    },
    {
      "id": "meds",
      "label": "Medication",
      "baseline": 2
    },
    {
      "id": "accessory",
      "label": "Accessories",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "food",
      "label": "Food stock",
      "categories": [
        "food"
      ]
    },
    {
      "id": "treats",
      "label": "Treat stock",
      "categories": [
        "treats"
      ]
    },
    {
      "id": "meds",
      "label": "Medication stock",
      "categories": [
        "meds"
      ]
    }
  ],
  "sample": [
    {
      "id": "store_stock_budget-dog-food-bag",
      "name": "Dog food bag",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "store_stock_budget-cat-food-case",
      "name": "Cat food case",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "new"
    },
    {
      "id": "store_stock_budget-training-treats",
      "name": "Training treats",
      "category": "treats",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "store_stock_budget-flea-treatment",
      "name": "Flea treatment",
      "category": "meds",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
