import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-bird-strike-cost-mcp",
  "title": "Bird Strike Budget Audit",
  "description": "Audit bird strike budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bird_strike_budget",
  "entity": "window budget line",
  "categories": [
    {
      "id": "windows",
      "label": "Windows",
      "baseline": 2
    },
    {
      "id": "decals",
      "label": "Decals",
      "baseline": 1
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "baseline": 1
    },
    {
      "id": "feeders",
      "label": "Feeders",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "windows",
      "label": "Windows",
      "categories": [
        "windows"
      ]
    },
    {
      "id": "decals",
      "label": "Decals",
      "categories": [
        "decals"
      ]
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "categories": [
        "lighting"
      ]
    },
    {
      "id": "feeders",
      "label": "Feeders",
      "categories": [
        "feeders"
      ]
    }
  ],
  "sample": [
    {
      "id": "bird_strike_budget_budget-window-decals",
      "name": "Window decals",
      "category": "windows",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "bird_strike_budget_budget-exterior-film",
      "name": "Exterior film",
      "category": "decals",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "bird_strike_budget_budget-motion-lights",
      "name": "Motion lights",
      "category": "lighting",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "bird_strike_budget_budget-feeder-move",
      "name": "Feeder move",
      "category": "feeders",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
