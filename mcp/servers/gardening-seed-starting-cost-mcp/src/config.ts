import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-seed-starting-cost-mcp",
  "title": "Seed Starting Budget Audit",
  "description": "Audit seed starting budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "seed_starting_budget",
  "entity": "seed packet budget line",
  "categories": [
    {
      "id": "herb",
      "label": "Herbs",
      "baseline": 3
    },
    {
      "id": "vegetable",
      "label": "Vegetables",
      "baseline": 5
    },
    {
      "id": "flower",
      "label": "Flowers",
      "baseline": 3
    },
    {
      "id": "fruit",
      "label": "Fruit",
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "leafy",
      "label": "Leafy harvest",
      "categories": [
        "herb",
        "vegetable"
      ]
    },
    {
      "id": "fruiting",
      "label": "Fruiting crops",
      "categories": [
        "vegetable",
        "fruit"
      ]
    },
    {
      "id": "flowers",
      "label": "Flower colour",
      "categories": [
        "flower"
      ]
    }
  ],
  "sample": [
    {
      "id": "seed_starting_budget-genovese-basil",
      "name": "Genovese basil",
      "category": "herb",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "seed_starting_budget-cherry-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "seed_starting_budget-bell-pepper",
      "name": "Bell pepper",
      "category": "vegetable",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "fair"
    },
    {
      "id": "seed_starting_budget-french-marigold",
      "name": "French marigold",
      "category": "flower",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "seed_starting_budget-dwarf-sunflower",
      "name": "Dwarf sunflower",
      "category": "flower",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "seed_starting_budget-alpine-strawberry",
      "name": "Alpine strawberry",
      "category": "fruit",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
