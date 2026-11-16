import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-fantasy-lineup-plan-mcp",
  "title": "Fantasy Lineup Planning Audit",
  "description": "Plan fantasy lineup by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fantasy_lineup_plan",
  "entity": "fantasy player plan",
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
    "id": "projected_points",
    "label": "Projected points",
    "unit": "points",
    "target": 100,
    "direction": "higher"
  },
  "target": {
    "maxItems": 10,
    "budget": 200,
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
      "id": "fantasy_lineup_plan-qb",
      "name": "Starting quarterback",
      "category": "quarterback",
      "tags": [
        "passing",
        "starter"
      ],
      "cost": 35,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-rb-one",
      "name": "Lead running back",
      "category": "running-back",
      "tags": [
        "rushing",
        "starter"
      ],
      "cost": 40,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-rb-two",
      "name": "Change-of-pace back",
      "category": "running-back",
      "tags": [
        "receiving",
        "flex"
      ],
      "cost": 12,
      "quantity": 11,
      "condition": "fair"
    },
    {
      "id": "fantasy_lineup_plan-wr-one",
      "name": "Top receiver",
      "category": "receiver",
      "tags": [
        "targets",
        "starter"
      ],
      "cost": 38,
      "quantity": 17,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-wr-two",
      "name": "Second receiver",
      "category": "receiver",
      "tags": [
        "deep",
        "starter"
      ],
      "cost": 24,
      "quantity": 13,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-wr-three",
      "name": "Slot receiver",
      "category": "receiver",
      "tags": [
        "short",
        "flex"
      ],
      "cost": 8,
      "quantity": 9,
      "condition": "fair"
    },
    {
      "id": "fantasy_lineup_plan-te",
      "name": "Tight end",
      "category": "tight-end",
      "tags": [
        "red-zone",
        "starter"
      ],
      "cost": 15,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-defense",
      "name": "Team defense",
      "category": "defense",
      "tags": [
        "streaming",
        "matchup"
      ],
      "cost": 5,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "fantasy_lineup_plan-kicker",
      "name": "Kicker",
      "category": "kicker",
      "tags": [
        "dome",
        "leg"
      ],
      "cost": 3,
      "quantity": 8,
      "condition": "fair"
    }
  ]
}
