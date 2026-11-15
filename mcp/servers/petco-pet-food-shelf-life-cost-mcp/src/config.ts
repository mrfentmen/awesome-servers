import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-pet-food-shelf-life-cost-mcp",
  "title": "Pet Food Shelf Life Budget Audit",
  "description": "Audit pet food shelf life budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pet_food_shelf_life_budget",
  "entity": "pet food item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
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
      "id": "pet_food_shelf_life_budget-adult-dog-kibble",
      "name": "Adult dog kibble",
      "category": "dog-food",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "pet_food_shelf_life_budget-cat-wet-food-pack",
      "name": "Cat wet food pack",
      "category": "cat-food",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "pet_food_shelf_life_budget-dog-dental-treats",
      "name": "Dog dental treats",
      "category": "treats",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "pet_food_shelf_life_budget-cat-salmon-treats",
      "name": "Cat salmon treats",
      "category": "treats",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "pet_food_shelf_life_budget-joint-supplement",
      "name": "Joint supplement",
      "category": "supplement",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "pet_food_shelf_life_budget-indoor-cat-kibble",
      "name": "Indoor cat kibble",
      "category": "cat-food",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    }
  ]
}
