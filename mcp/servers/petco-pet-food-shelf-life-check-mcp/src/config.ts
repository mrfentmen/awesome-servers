import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-pet-food-shelf-life-check-mcp",
  "title": "Pet Food Shelf Life Audit",
  "description": "Audit pet food stock for expiry, category coverage, spend and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pet_food_shelf_life",
  "entity": "pet food item",
  "categories": [
    {
      "id": "dog-food",
      "label": "Dog food",
      "baseline": 4
    },
    {
      "id": "cat-food",
      "label": "Cat food",
      "baseline": 4
    },
    {
      "id": "treats",
      "label": "Treats",
      "baseline": 3
    },
    {
      "id": "supplement",
      "label": "Supplements",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "dog-meal",
      "label": "Dog meals",
      "categories": [
        "dog-food"
      ]
    },
    {
      "id": "cat-meal",
      "label": "Cat meals",
      "categories": [
        "cat-food"
      ]
    },
    {
      "id": "treats",
      "label": "Treats",
      "categories": [
        "treats"
      ]
    }
  ],
  "sample": [
    {
      "id": "pet-dog-kibble",
      "name": "Adult dog kibble",
      "category": "dog-food",
      "tags": [
        "chicken"
      ],
      "cost": 60,
      "quantity": 1,
      "acquired": "2026-09-01",
      "expires": "2027-05-01",
      "condition": "new"
    },
    {
      "id": "pet-cat-wet",
      "name": "Cat wet food pack",
      "category": "cat-food",
      "tags": [
        "fish"
      ],
      "cost": 30,
      "quantity": 12,
      "acquired": "2026-08-01",
      "expires": "2027-03-01",
      "condition": "new"
    },
    {
      "id": "pet-dog-treats",
      "name": "Dog dental treats",
      "category": "treats",
      "tags": [
        "dental"
      ],
      "cost": 15,
      "quantity": 1,
      "acquired": "2026-05-01",
      "expires": "2026-12-01",
      "condition": "good"
    },
    {
      "id": "pet-cat-treats",
      "name": "Cat salmon treats",
      "category": "treats",
      "tags": [
        "salmon"
      ],
      "cost": 12,
      "quantity": 1,
      "acquired": "2025-11-01",
      "expires": "2025-12-01",
      "condition": "fair"
    },
    {
      "id": "pet-joint",
      "name": "Joint supplement",
      "category": "supplement",
      "tags": [
        "joint"
      ],
      "cost": 25,
      "quantity": 1,
      "acquired": "2026-06-01",
      "expires": "2027-01-01",
      "condition": "good"
    },
    {
      "id": "pet-cat-kibble",
      "name": "Indoor cat kibble",
      "category": "cat-food",
      "tags": [
        "indoor"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-09-15",
      "expires": "2027-06-01",
      "condition": "new"
    }
  ]
}
