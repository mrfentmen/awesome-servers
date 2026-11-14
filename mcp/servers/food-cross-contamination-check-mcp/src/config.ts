import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-cross-contamination-check-mcp",
  "title": "Cross Contamination Audit",
  "description": "Audit boards, knives, containers and fridge storage for raw, cooked and clean separation risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cross_contamination",
  "entity": "kitchen item",
  "categories": [
    {
      "id": "board",
      "label": "Cutting boards",
      "baseline": 2
    },
    {
      "id": "knife",
      "label": "Knives",
      "baseline": 3
    },
    {
      "id": "container",
      "label": "Containers",
      "baseline": 3
    },
    {
      "id": "fridge",
      "label": "Fridge storage",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "dtc_severity",
    "label": "Contamination severity",
    "unit": "score",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "prep",
      "label": "Preparation surface",
      "categories": [
        "board",
        "knife"
      ]
    },
    {
      "id": "storage",
      "label": "Storage",
      "categories": [
        "container",
        "fridge"
      ]
    }
  ],
  "sample": [
    {
      "id": "food-board-raw",
      "name": "Raw meat board",
      "category": "board",
      "tags": [
        "raw",
        "critical"
      ],
      "cost": 15,
      "quantity": 1,
      "acquired": "2025-01-01",
      "condition": "fair"
    },
    {
      "id": "food-board-veg",
      "name": "Vegetable board",
      "category": "board",
      "tags": [
        "clean"
      ],
      "cost": 12,
      "quantity": 1,
      "acquired": "2026-01-01",
      "condition": "good"
    },
    {
      "id": "food-knife-raw",
      "name": "Raw prep knife",
      "category": "knife",
      "tags": [
        "raw",
        "warning"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2025-06-01",
      "condition": "good"
    },
    {
      "id": "food-container",
      "name": "Sealed container",
      "category": "container",
      "tags": [
        "clean"
      ],
      "cost": 8,
      "quantity": 4,
      "acquired": "2026-02-01",
      "condition": "new"
    },
    {
      "id": "food-fridge",
      "name": "Fridge shelf",
      "category": "fridge",
      "tags": [
        "clean"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-01",
      "condition": "good"
    }
  ]
}
