import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-lawn-water-check-mcp",
  "title": "Lawn Water Audit",
  "description": "Audit lawn water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lawn_water",
  "entity": "watering zone",
  "categories": [
    {
      "id": "lawn",
      "label": "Lawn",
      "baseline": 2
    },
    {
      "id": "bed",
      "label": "Beds",
      "baseline": 1
    },
    {
      "id": "container",
      "label": "Containers",
      "baseline": 1
    },
    {
      "id": "tree",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "irrigation",
      "label": "Irrigation",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "water_liters",
    "label": "Water use",
    "unit": "L",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 12,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lawn",
      "label": "Lawn coverage",
      "categories": [
        "lawn"
      ]
    },
    {
      "id": "beds",
      "label": "Bed coverage",
      "categories": [
        "bed"
      ]
    },
    {
      "id": "containers",
      "label": "Container coverage",
      "categories": [
        "container"
      ]
    },
    {
      "id": "trees",
      "label": "Tree coverage",
      "categories": [
        "tree"
      ]
    }
  ],
  "sample": [
    {
      "id": "lawn_water-front",
      "name": "Front lawn",
      "category": "lawn",
      "tags": [
        "turf",
        "full-sun"
      ],
      "cost": 18,
      "quantity": 650,
      "condition": "good"
    },
    {
      "id": "lawn_water-side",
      "name": "Side lawn",
      "category": "lawn",
      "tags": [
        "turf",
        "shade"
      ],
      "cost": 12,
      "quantity": 420,
      "condition": "good"
    },
    {
      "id": "lawn_water-bed",
      "name": "Flower bed",
      "category": "bed",
      "tags": [
        "perennial",
        "mulched"
      ],
      "cost": 8,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "lawn_water-pots",
      "name": "Patio pots",
      "category": "container",
      "tags": [
        "annual",
        "sun"
      ],
      "cost": 5,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "lawn_water-tree",
      "name": "Maple tree",
      "category": "tree",
      "tags": [
        "established",
        "shade"
      ],
      "cost": 10,
      "quantity": 240,
      "condition": "good"
    },
    {
      "id": "lawn_water-drip",
      "name": "Drip line",
      "category": "irrigation",
      "tags": [
        "drip",
        "timer"
      ],
      "cost": 120,
      "quantity": 300,
      "condition": "good"
    }
  ]
}
