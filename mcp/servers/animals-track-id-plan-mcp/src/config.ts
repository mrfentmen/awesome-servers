import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-track-id-plan-mcp",
  "title": "Wildlife Track ID Planning Audit",
  "description": "Plan wildlife track id by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "track_id_plan",
  "entity": "track plan",
  "categories": [
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "gait",
      "label": "Gait",
      "baseline": 1
    },
    {
      "id": "substrate",
      "label": "Substrate",
      "baseline": 1
    },
    {
      "id": "guides",
      "label": "Guides",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "track_count",
    "label": "Track count",
    "unit": "tracks",
    "target": 3,
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
      "id": "photos",
      "label": "Photos",
      "categories": [
        "photos"
      ]
    },
    {
      "id": "gait",
      "label": "Gait",
      "categories": [
        "gait"
      ]
    },
    {
      "id": "substrate",
      "label": "Substrate",
      "categories": [
        "substrate"
      ]
    },
    {
      "id": "guides",
      "label": "Guides",
      "categories": [
        "guides"
      ]
    }
  ],
  "sample": [
    {
      "id": "track_id_plan-front-track",
      "name": "Front track",
      "category": "photos",
      "tags": [
        "photos"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "track_id_plan-gait-pattern",
      "name": "Gait pattern",
      "category": "gait",
      "tags": [
        "gait"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "track_id_plan-mud-substrate",
      "name": "Mud substrate",
      "category": "substrate",
      "tags": [
        "substrate"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "track_id_plan-field-guide",
      "name": "Field guide",
      "category": "guides",
      "tags": [
        "guides"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
