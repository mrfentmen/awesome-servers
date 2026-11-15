import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-road-trip-pack-sim-mcp",
  "title": "Road Trip Pack Simulator",
  "description": "Simulate road trip pack by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "road_trip_pack_sim",
  "entity": "pack item simulation",
  "categories": [
    {
      "id": "docs",
      "label": "Documents",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
      "baseline": 2
    },
    {
      "id": "snacks",
      "label": "Snacks",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Pack readiness",
    "unit": "points",
    "target": 5,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "docs",
      "label": "Documents",
      "categories": [
        "docs"
      ]
    },
    {
      "id": "safety",
      "label": "Safety kit",
      "categories": [
        "safety"
      ]
    },
    {
      "id": "snacks",
      "label": "Snacks",
      "categories": [
        "snacks"
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
      "id": "trip-docs",
      "name": "Insurance and licence",
      "category": "docs",
      "tags": [
        "wallet"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "trip-safety",
      "name": "First aid kit",
      "category": "safety",
      "tags": [
        "sealed"
      ],
      "cost": 30,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "trip-snacks",
      "name": "Snack box",
      "category": "snacks",
      "tags": [
        "dry"
      ],
      "cost": 15,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "trip-tools",
      "name": "Tire repair kit",
      "category": "tools",
      "tags": [
        "car"
      ],
      "cost": 25,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
