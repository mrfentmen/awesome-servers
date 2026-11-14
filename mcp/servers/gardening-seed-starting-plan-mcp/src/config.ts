import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-seed-starting-plan-mcp",
  "title": "Seed Starting Plan Audit",
  "description": "Plan seed starting from germination rates, category coverage, expiry windows and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "seed_starting",
  "entity": "seed packet",
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
    "id": "germination_rate",
    "label": "Germination rate",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 25,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 60
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
      "id": "seed-basil",
      "name": "Genovese basil",
      "category": "herb",
      "tags": [
        "annual"
      ],
      "cost": 4,
      "quantity": 85,
      "acquired": "2026-03-01",
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "seed-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "indeterminate"
      ],
      "cost": 5,
      "quantity": 92,
      "acquired": "2026-02-01",
      "expires": "2027-02-01",
      "condition": "good"
    },
    {
      "id": "seed-pepper",
      "name": "Bell pepper",
      "category": "vegetable",
      "tags": [
        "warm-season"
      ],
      "cost": 4,
      "quantity": 70,
      "acquired": "2025-02-01",
      "expires": "2026-12-15",
      "condition": "fair"
    },
    {
      "id": "seed-marigold",
      "name": "French marigold",
      "category": "flower",
      "tags": [
        "companion"
      ],
      "cost": 3,
      "quantity": 88,
      "acquired": "2026-03-01",
      "expires": "2027-04-01",
      "condition": "good"
    },
    {
      "id": "seed-sunflower",
      "name": "Dwarf sunflower",
      "category": "flower",
      "tags": [
        "annual"
      ],
      "cost": 3,
      "quantity": 60,
      "acquired": "2025-03-01",
      "expires": "2027-01-15",
      "condition": "fair"
    },
    {
      "id": "seed-strawberry",
      "name": "Alpine strawberry",
      "category": "fruit",
      "tags": [
        "perennial"
      ],
      "cost": 6,
      "quantity": 78,
      "acquired": "2026-01-01",
      "expires": "2027-05-01",
      "condition": "good"
    }
  ]
}
