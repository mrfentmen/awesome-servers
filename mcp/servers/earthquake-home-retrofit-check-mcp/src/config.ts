import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-home-retrofit-check-mcp",
  "title": "Home Retrofit Audit",
  "description": "Audit foundation bolts, cripple walls, water heater straps and cabinet latches. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "home_retrofit",
  "entity": "retrofit item",
  "categories": [
    {
      "id": "foundation",
      "label": "Foundation",
      "baseline": 2
    },
    {
      "id": "frame",
      "label": "Frame",
      "baseline": 1
    },
    {
      "id": "water-heater",
      "label": "Water Heater",
      "baseline": 1
    },
    {
      "id": "contents",
      "label": "Contents",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "retrofit_points",
    "label": "Retrofit points",
    "unit": "points",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 4700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "foundation",
      "label": "Foundation",
      "categories": [
        "foundation"
      ]
    },
    {
      "id": "frame",
      "label": "Frame",
      "categories": [
        "frame"
      ]
    },
    {
      "id": "water-heater",
      "label": "Water Heater",
      "categories": [
        "water-heater"
      ]
    },
    {
      "id": "contents",
      "label": "Contents",
      "categories": [
        "contents"
      ]
    }
  ],
  "sample": [
    {
      "id": "home_retrofit-foundation-bolts",
      "name": "Foundation bolts",
      "category": "foundation",
      "tags": [
        "foundation"
      ],
      "cost": 1200,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "home_retrofit-cripple-wall-bracing",
      "name": "Cripple wall bracing",
      "category": "frame",
      "tags": [
        "frame"
      ],
      "cost": 2500,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "home_retrofit-water-heater-strap",
      "name": "Water heater strap",
      "category": "water-heater",
      "tags": [
        "water-heater"
      ],
      "cost": 150,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "home_retrofit-cabinet-latches",
      "name": "Cabinet latches",
      "category": "contents",
      "tags": [
        "contents"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
