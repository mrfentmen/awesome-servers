import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-balcony-garden-cost-mcp",
  "title": "Balcony Garden Budget Audit",
  "description": "Audit balcony garden budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "balcony_garden_budget",
  "entity": "balcony plant budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
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
      "id": "balcony_garden_budget-basil",
      "name": "Basil",
      "category": "herb",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "balcony_garden_budget-cherry-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "balcony_garden_budget-lettuce",
      "name": "Lettuce",
      "category": "vegetable",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "balcony_garden_budget-geranium",
      "name": "Geranium",
      "category": "flower",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "balcony_garden_budget-rail-planter",
      "name": "Rail planter",
      "category": "container",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "balcony_garden_budget-trellis",
      "name": "Trellis",
      "category": "support",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
