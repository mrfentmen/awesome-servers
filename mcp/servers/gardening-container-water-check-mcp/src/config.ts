import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-container-water-check-mcp",
  "title": "Container Water Audit",
  "description": "Audit container water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "container_water",
  "entity": "container planting",
  "categories": [
    {
      "id": "pot",
      "label": "Pots",
      "baseline": 2
    },
    {
      "id": "basket",
      "label": "Baskets",
      "baseline": 1
    },
    {
      "id": "trough",
      "label": "Troughs",
      "baseline": 1
    },
    {
      "id": "herb",
      "label": "Herbs",
      "baseline": 1
    },
    {
      "id": "tropical",
      "label": "Tropicals",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "water_interval",
    "label": "Water interval",
    "unit": "days",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 160,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "pots",
      "label": "Pot watering",
      "categories": [
        "pot"
      ]
    },
    {
      "id": "baskets",
      "label": "Basket watering",
      "categories": [
        "basket"
      ]
    },
    {
      "id": "troughs",
      "label": "Trough watering",
      "categories": [
        "trough"
      ]
    },
    {
      "id": "herbs",
      "label": "Herb watering",
      "categories": [
        "herb"
      ]
    }
  ],
  "sample": [
    {
      "id": "container_water-terracotta",
      "name": "Terracotta pot",
      "category": "pot",
      "tags": [
        "terracotta",
        "sun"
      ],
      "cost": 18,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "container_water-succulent",
      "name": "Succulent pot",
      "category": "pot",
      "tags": [
        "succulent",
        "dry"
      ],
      "cost": 12,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "container_water-basket",
      "name": "Hanging basket",
      "category": "basket",
      "tags": [
        "annual",
        "wind"
      ],
      "cost": 22,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "container_water-trough",
      "name": "Window trough",
      "category": "trough",
      "tags": [
        "herb",
        "sun"
      ],
      "cost": 25,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "container_water-basil",
      "name": "Basil pot",
      "category": "herb",
      "tags": [
        "culinary",
        "sun"
      ],
      "cost": 8,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "container_water-fern",
      "name": "Fern",
      "category": "tropical",
      "tags": [
        "humidity",
        "shade"
      ],
      "cost": 16,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
