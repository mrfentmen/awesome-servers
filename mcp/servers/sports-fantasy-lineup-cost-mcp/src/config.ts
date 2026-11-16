import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-fantasy-lineup-cost-mcp",
  "title": "Fantasy Lineup Budget Audit",
  "description": "Audit fantasy lineup budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fantasy_lineup_budget",
  "entity": "fantasy player budget line",
  "categories": [
    {
      "id": "quarterback",
      "label": "Quarterback",
      "baseline": 1
    },
    {
      "id": "running-back",
      "label": "Running back",
      "baseline": 2
    },
    {
      "id": "receiver",
      "label": "Receiver",
      "baseline": 3
    },
    {
      "id": "tight-end",
      "label": "Tight end",
      "baseline": 1
    },
    {
      "id": "defense",
      "label": "Defense",
      "baseline": 1
    },
    {
      "id": "kicker",
      "label": "Kicker",
      "baseline": 1
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
    "budget": 250,
    "coverage": 0.9,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "passing",
      "label": "Passing game",
      "categories": [
        "quarterback",
        "receiver",
        "tight-end"
      ]
    },
    {
      "id": "rushing",
      "label": "Rushing game",
      "categories": [
        "running-back"
      ]
    },
    {
      "id": "defense",
      "label": "Defense slot",
      "categories": [
        "defense"
      ]
    },
    {
      "id": "kicking",
      "label": "Kicking slot",
      "categories": [
        "kicker"
      ]
    }
  ],
  "sample": [
    {
      "id": "fantasy_lineup_budget-starting-quarterback",
      "name": "Starting quarterback",
      "category": "quarterback",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-lead-running-back",
      "name": "Lead running back",
      "category": "running-back",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-change-of-pace-back",
      "name": "Change-of-pace back",
      "category": "running-back",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "fantasy_lineup_budget-top-receiver",
      "name": "Top receiver",
      "category": "receiver",
      "tags": [
        "budget"
      ],
      "cost": 38,
      "quantity": 38,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-second-receiver",
      "name": "Second receiver",
      "category": "receiver",
      "tags": [
        "budget"
      ],
      "cost": 24,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-slot-receiver",
      "name": "Slot receiver",
      "category": "receiver",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "fantasy_lineup_budget-tight-end",
      "name": "Tight end",
      "category": "tight-end",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-team-defense",
      "name": "Team defense",
      "category": "defense",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_budget-kicker",
      "name": "Kicker",
      "category": "kicker",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "fair"
    }
  ]
}
