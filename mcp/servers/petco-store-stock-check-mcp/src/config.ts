import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-store-stock-check-mcp",
  "title": "Pet Store Stock Audit",
  "description": "Audit pet store stock for food, treats, medication and accessory expiry. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "store_stock",
  "entity": "stock item",
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
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 60,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 60
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
      "id": "stock-dog-food",
      "name": "Dog food bag",
      "category": "food",
      "tags": [
        "dry"
      ],
      "cost": 50,
      "quantity": 1,
      "expires": "2027-08-01",
      "condition": "new"
    },
    {
      "id": "stock-cat-food",
      "name": "Cat food case",
      "category": "food",
      "tags": [
        "wet"
      ],
      "cost": 35,
      "quantity": 1,
      "expires": "2027-04-01",
      "condition": "new"
    },
    {
      "id": "stock-treats",
      "name": "Training treats",
      "category": "treats",
      "tags": [
        "soft"
      ],
      "cost": 10,
      "quantity": 1,
      "expires": "2026-12-01",
      "condition": "good"
    },
    {
      "id": "stock-meds",
      "name": "Flea treatment",
      "category": "meds",
      "tags": [
        "topical"
      ],
      "cost": 25,
      "quantity": 1,
      "expires": "2027-01-01",
      "condition": "good"
    }
  ]
}
