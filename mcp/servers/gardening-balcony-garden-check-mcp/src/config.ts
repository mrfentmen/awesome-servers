import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-balcony-garden-check-mcp",
  "title": "Balcony Garden Audit",
  "description": "Audit balcony garden by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "balcony_garden",
  "entity": "balcony plant",
  "categories": [
    {
      "id": "herb",
      "label": "Herbs",
      "baseline": 2
    },
    {
      "id": "vegetable",
      "label": "Vegetables",
      "baseline": 2
    },
    {
      "id": "flower",
      "label": "Flowers",
      "baseline": 1
    },
    {
      "id": "container",
      "label": "Containers",
      "baseline": 2
    },
    {
      "id": "support",
      "label": "Supports",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "sun_hours",
    "label": "Sun hours",
    "unit": "hours",
    "target": 6,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 180,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "herbs",
      "label": "Herb bed",
      "categories": [
        "herb"
      ]
    },
    {
      "id": "vegetables",
      "label": "Vegetable bed",
      "categories": [
        "vegetable"
      ]
    },
    {
      "id": "flowers",
      "label": "Flower display",
      "categories": [
        "flower"
      ]
    },
    {
      "id": "structure",
      "label": "Container support",
      "categories": [
        "container",
        "support"
      ]
    }
  ],
  "sample": [
    {
      "id": "balcony_garden-basil",
      "name": "Basil",
      "category": "herb",
      "tags": [
        "culinary",
        "sun"
      ],
      "cost": 8,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "balcony_garden-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "fruiting",
        "sun"
      ],
      "cost": 12,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "balcony_garden-lettuce",
      "name": "Lettuce",
      "category": "vegetable",
      "tags": [
        "leafy",
        "shade"
      ],
      "cost": 6,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "balcony_garden-geranium",
      "name": "Geranium",
      "category": "flower",
      "tags": [
        "pollinator",
        "sun"
      ],
      "cost": 10,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "balcony_garden-planter",
      "name": "Rail planter",
      "category": "container",
      "tags": [
        "railing",
        "light"
      ],
      "cost": 25,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "balcony_garden-trellis",
      "name": "Trellis",
      "category": "support",
      "tags": [
        "wood",
        "vertical"
      ],
      "cost": 30,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
