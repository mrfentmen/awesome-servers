import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-asteroid-close-match-mcp",
  "title": "Asteroid Close Approach Match Audit",
  "description": "Match asteroid close approach by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "asteroid_close_match",
  "entity": "close approach match",
  "categories": [
    {
      "id": "date",
      "label": "Date",
      "baseline": 2
    },
    {
      "id": "distance",
      "label": "Distance",
      "baseline": 1
    },
    {
      "id": "size",
      "label": "Size",
      "baseline": 1
    },
    {
      "id": "observation",
      "label": "Observation",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "distance_lunar",
    "label": "Distance",
    "unit": "lunar distances",
    "target": 10,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "date",
      "label": "Date",
      "categories": [
        "date"
      ]
    },
    {
      "id": "distance",
      "label": "Distance",
      "categories": [
        "distance"
      ]
    },
    {
      "id": "size",
      "label": "Size",
      "categories": [
        "size"
      ]
    },
    {
      "id": "observation",
      "label": "Observation",
      "categories": [
        "observation"
      ]
    }
  ],
  "sample": [
    {
      "id": "asteroid_close_match-approach-date",
      "name": "Approach date",
      "category": "date",
      "tags": [
        "date"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "asteroid_close_match-close-distance",
      "name": "Close distance",
      "category": "distance",
      "tags": [
        "distance"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "asteroid_close_match-asteroid-size",
      "name": "Asteroid size",
      "category": "size",
      "tags": [
        "size"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "asteroid_close_match-observation-plan",
      "name": "Observation plan",
      "category": "observation",
      "tags": [
        "observation"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
