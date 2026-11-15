import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-marathon-pace-cost-mcp",
  "title": "Marathon Pace Budget Audit",
  "description": "Audit marathon pace budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "marathon_pace_budget",
  "entity": "run session budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
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
      "id": "marathon_pace_budget-easy-run",
      "name": "Easy run",
      "category": "easy",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "marathon_pace_budget-tempo-run",
      "name": "Tempo run",
      "category": "tempo",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "marathon_pace_budget-long-run",
      "name": "Long run",
      "category": "long",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "marathon_pace_budget-race-pace-block",
      "name": "Race pace block",
      "category": "race",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
