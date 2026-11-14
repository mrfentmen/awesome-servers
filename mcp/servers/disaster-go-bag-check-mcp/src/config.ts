import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-go-bag-check-mcp",
  "title": "Go Bag Audit",
  "description": "Audit a go bag for water, food, medical, light and tool coverage plus days of supply. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "go_bag",
  "entity": "go-bag item",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 2
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "light",
      "label": "Light",
      "baseline": 1
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days of supply",
    "unit": "days",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Drinking water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "food",
      "label": "Food supply",
      "categories": [
        "food"
      ]
    },
    {
      "id": "medical",
      "label": "Medical supply",
      "categories": [
        "medical"
      ]
    },
    {
      "id": "light",
      "label": "Light source",
      "categories": [
        "light"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    }
  ],
  "sample": [
    {
      "id": "bag-water",
      "name": "Water pouches",
      "category": "water",
      "tags": [
        "sealed"
      ],
      "cost": 12,
      "quantity": 3,
      "acquired": "2026-01-01",
      "expires": "2028-01-01",
      "condition": "new"
    },
    {
      "id": "bag-food",
      "name": "Energy bars",
      "category": "food",
      "tags": [
        "calories"
      ],
      "cost": 15,
      "quantity": 2,
      "acquired": "2026-02-01",
      "expires": "2027-02-01",
      "condition": "good"
    },
    {
      "id": "bag-first-aid",
      "name": "First aid kit",
      "category": "medical",
      "tags": [
        "sealed"
      ],
      "cost": 35,
      "quantity": 3,
      "acquired": "2026-03-01",
      "expires": "2028-03-01",
      "condition": "new"
    },
    {
      "id": "bag-flashlight",
      "name": "Hand crank flashlight",
      "category": "light",
      "tags": [
        "crank"
      ],
      "cost": 20,
      "quantity": 3,
      "acquired": "2026-01-01",
      "condition": "new"
    },
    {
      "id": "bag-multi-tool",
      "name": "Multi-tool",
      "category": "tools",
      "tags": [
        "steel"
      ],
      "cost": 30,
      "quantity": 3,
      "acquired": "2026-01-01",
      "condition": "good"
    }
  ]
}
