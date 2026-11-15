import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-hike-difficulty-cost-mcp",
  "title": "Hike Difficulty Budget Audit",
  "description": "Audit hike difficulty budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hike_difficulty_budget",
  "entity": "hike budget line",
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
      "id": "hike_difficulty_budget-river-walk",
      "name": "River walk",
      "category": "easy",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "hike_difficulty_budget-ridge-trail",
      "name": "Ridge trail",
      "category": "moderate",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "hike_difficulty_budget-summit-route",
      "name": "Summit route",
      "category": "hard",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "fair"
    },
    {
      "id": "hike_difficulty_budget-lake-loop",
      "name": "Lake loop",
      "category": "loop",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
