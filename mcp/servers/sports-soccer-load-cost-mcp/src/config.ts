import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-soccer-load-cost-mcp",
  "title": "Soccer Load Budget Audit",
  "description": "Audit soccer load budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soccer_load_budget",
  "entity": "session budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
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
      "id": "soccer_load_budget-team-training",
      "name": "Team training",
      "category": "training",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "soccer_load_budget-league-match",
      "name": "League match",
      "category": "match",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "soccer_load_budget-recovery-session",
      "name": "Recovery session",
      "category": "recovery",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "soccer_load_budget-strength-session",
      "name": "Strength session",
      "category": "gym",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "fair"
    }
  ]
}
