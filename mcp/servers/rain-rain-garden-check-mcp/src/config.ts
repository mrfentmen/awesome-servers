import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-rain-garden-check-mcp",
  "title": "Rain Garden Audit",
  "description": "Audit basin size, soil, native plants and overflow for a rain garden. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rain_garden",
  "entity": "rain garden item",
  "categories": [
    {
      "id": "basin",
      "label": "Basin",
      "baseline": 2
    },
    {
      "id": "soil",
      "label": "Soil",
      "baseline": 1
    },
    {
      "id": "plants",
      "label": "Plants",
      "baseline": 1
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "drainage_area",
    "label": "Drainage area",
    "unit": "sq ft",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "basin",
      "label": "Basin",
      "categories": [
        "basin"
      ]
    },
    {
      "id": "soil",
      "label": "Soil",
      "categories": [
        "soil"
      ]
    },
    {
      "id": "plants",
      "label": "Plants",
      "categories": [
        "plants"
      ]
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "categories": [
        "overflow"
      ]
    }
  ],
  "sample": [
    {
      "id": "rain_garden-rain-garden-basin",
      "name": "Rain garden basin",
      "category": "basin",
      "tags": [
        "basin"
      ],
      "cost": 300,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "rain_garden-compost",
      "name": "Compost",
      "category": "soil",
      "tags": [
        "soil"
      ],
      "cost": 40,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "rain_garden-native-plants",
      "name": "Native plants",
      "category": "plants",
      "tags": [
        "plants"
      ],
      "cost": 120,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "rain_garden-overflow-channel",
      "name": "Overflow channel",
      "category": "overflow",
      "tags": [
        "overflow"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
