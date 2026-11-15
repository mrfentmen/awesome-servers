import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-backyard-habitat-check-mcp",
  "title": "Backyard Habitat Audit",
  "description": "Audit native plants, water, shelter and pesticide use in a backyard habitat. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "backyard_habitat",
  "entity": "habitat feature",
  "categories": [
    {
      "id": "plants",
      "label": "Plants",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    },
    {
      "id": "shelter",
      "label": "Shelter",
      "baseline": 1
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "native_species",
    "label": "Native species",
    "unit": "species",
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
      "id": "plants",
      "label": "Plants",
      "categories": [
        "plants"
      ]
    },
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "shelter",
      "label": "Shelter",
      "categories": [
        "shelter"
      ]
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "categories": [
        "pesticide"
      ]
    }
  ],
  "sample": [
    {
      "id": "backyard_habitat-native-plants",
      "name": "Native plants",
      "category": "plants",
      "tags": [
        "plants"
      ],
      "cost": 80,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "backyard_habitat-water-source",
      "name": "Water source",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "backyard_habitat-brush-shelter",
      "name": "Brush shelter",
      "category": "shelter",
      "tags": [
        "shelter"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "backyard_habitat-pesticide-free-zone",
      "name": "Pesticide-free zone",
      "category": "pesticide",
      "tags": [
        "pesticide"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
