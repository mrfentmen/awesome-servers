import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-hike-difficulty-check-mcp",
  "title": "Hike Difficulty Audit",
  "description": "Audit hike options by distance, difficulty, spend and route coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hike_difficulty",
  "entity": "hike",
  "categories": [
    {
      "id": "easy",
      "label": "Easy hikes",
      "baseline": 3
    },
    {
      "id": "moderate",
      "label": "Moderate hikes",
      "baseline": 3
    },
    {
      "id": "hard",
      "label": "Hard hikes",
      "baseline": 2
    },
    {
      "id": "loop",
      "label": "Loop hikes",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Distance",
    "unit": "miles",
    "target": 8,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "easy",
      "label": "Easy route",
      "categories": [
        "easy"
      ]
    },
    {
      "id": "moderate",
      "label": "Moderate route",
      "categories": [
        "moderate"
      ]
    },
    {
      "id": "hard",
      "label": "Hard route",
      "categories": [
        "hard"
      ]
    },
    {
      "id": "loop",
      "label": "Loop route",
      "categories": [
        "loop"
      ]
    }
  ],
  "sample": [
    {
      "id": "hike-river",
      "name": "River walk",
      "category": "easy",
      "tags": [
        "flat"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "hike-ridge",
      "name": "Ridge trail",
      "category": "moderate",
      "tags": [
        "views"
      ],
      "cost": 5,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "hike-summit",
      "name": "Summit route",
      "category": "hard",
      "tags": [
        "climb"
      ],
      "cost": 10,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "hike-loop",
      "name": "Lake loop",
      "category": "loop",
      "tags": [
        "family"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
