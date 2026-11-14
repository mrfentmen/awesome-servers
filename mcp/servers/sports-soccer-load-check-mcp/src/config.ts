import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-soccer-load-check-mcp",
  "title": "Soccer Load Audit",
  "description": "Audit soccer training, matches, recovery and gym minutes for load balance. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soccer_load",
  "entity": "session",
  "categories": [
    {
      "id": "training",
      "label": "Training",
      "baseline": 3
    },
    {
      "id": "match",
      "label": "Matches",
      "baseline": 2
    },
    {
      "id": "recovery",
      "label": "Recovery",
      "baseline": 2
    },
    {
      "id": "gym",
      "label": "Gym",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Session minutes",
    "unit": "minutes",
    "target": 90,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "training",
      "label": "Training load",
      "categories": [
        "training"
      ]
    },
    {
      "id": "match",
      "label": "Match load",
      "categories": [
        "match"
      ]
    },
    {
      "id": "recovery",
      "label": "Recovery",
      "categories": [
        "recovery"
      ]
    },
    {
      "id": "gym",
      "label": "Strength",
      "categories": [
        "gym"
      ]
    }
  ],
  "sample": [
    {
      "id": "soccer-training",
      "name": "Team training",
      "category": "training",
      "tags": [
        "ball"
      ],
      "cost": 0,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "soccer-match",
      "name": "League match",
      "category": "match",
      "tags": [
        "match"
      ],
      "cost": 20,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "soccer-recovery",
      "name": "Recovery session",
      "category": "recovery",
      "tags": [
        "mobility"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "soccer-gym",
      "name": "Strength session",
      "category": "gym",
      "tags": [
        "lower-body"
      ],
      "cost": 15,
      "quantity": 60,
      "condition": "fair"
    }
  ]
}
