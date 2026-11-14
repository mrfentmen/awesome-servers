import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-marathon-pace-check-mcp",
  "title": "Marathon Pace Audit",
  "description": "Audit marathon training paces by session type, pace target, coverage and race readiness. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "marathon_pace",
  "entity": "run session",
  "categories": [
    {
      "id": "easy",
      "label": "Easy pace",
      "baseline": 3
    },
    {
      "id": "tempo",
      "label": "Tempo pace",
      "baseline": 2
    },
    {
      "id": "long",
      "label": "Long pace",
      "baseline": 2
    },
    {
      "id": "race",
      "label": "Race pace",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Pace",
    "unit": "min/mile",
    "target": 8,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "easy",
      "label": "Easy pace",
      "categories": [
        "easy"
      ]
    },
    {
      "id": "tempo",
      "label": "Tempo pace",
      "categories": [
        "tempo"
      ]
    },
    {
      "id": "long",
      "label": "Long pace",
      "categories": [
        "long"
      ]
    },
    {
      "id": "race",
      "label": "Race pace",
      "categories": [
        "race"
      ]
    }
  ],
  "sample": [
    {
      "id": "pace-easy",
      "name": "Easy run",
      "category": "easy",
      "tags": [
        "zone2"
      ],
      "cost": 0,
      "quantity": 9.5,
      "condition": "good"
    },
    {
      "id": "pace-tempo",
      "name": "Tempo run",
      "category": "tempo",
      "tags": [
        "threshold"
      ],
      "cost": 0,
      "quantity": 8.2,
      "condition": "good"
    },
    {
      "id": "pace-long",
      "name": "Long run",
      "category": "long",
      "tags": [
        "endurance"
      ],
      "cost": 0,
      "quantity": 9,
      "condition": "fair"
    },
    {
      "id": "pace-race",
      "name": "Race pace block",
      "category": "race",
      "tags": [
        "goal"
      ],
      "cost": 0,
      "quantity": 7.5,
      "condition": "good"
    }
  ]
}
