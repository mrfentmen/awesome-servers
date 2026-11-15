import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-heat-index-match-mcp",
  "title": "Heat Index Match Audit",
  "description": "Match heat index by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "heat_index_match",
  "entity": "heat check match",
  "categories": [
    {
      "id": "indoor",
      "label": "Indoor",
      "baseline": 2
    },
    {
      "id": "outdoor",
      "label": "Outdoor",
      "baseline": 1
    },
    {
      "id": "shade",
      "label": "Shade",
      "baseline": 1
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "heat_index",
    "label": "Heat index",
    "unit": "°F",
    "target": 90,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "indoor",
      "label": "Indoor",
      "categories": [
        "indoor"
      ]
    },
    {
      "id": "outdoor",
      "label": "Outdoor",
      "categories": [
        "outdoor"
      ]
    },
    {
      "id": "shade",
      "label": "Shade",
      "categories": [
        "shade"
      ]
    },
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    }
  ],
  "sample": [
    {
      "id": "heat_index_match-living-room",
      "name": "Living room",
      "category": "indoor",
      "tags": [
        "indoor"
      ],
      "cost": 0,
      "quantity": 92,
      "condition": "fair"
    },
    {
      "id": "heat_index_match-patio",
      "name": "Patio",
      "category": "outdoor",
      "tags": [
        "outdoor"
      ],
      "cost": 0,
      "quantity": 104,
      "condition": "worn"
    },
    {
      "id": "heat_index_match-shade-sail",
      "name": "Shade sail",
      "category": "shade",
      "tags": [
        "shade"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "heat_index_match-water-station",
      "name": "Water station",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
