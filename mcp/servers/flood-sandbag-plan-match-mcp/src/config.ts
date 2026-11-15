import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-sandbag-plan-match-mcp",
  "title": "Sandbag Plan Match Audit",
  "description": "Match sandbag plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sandbag_plan_match",
  "entity": "sandbag item match",
  "categories": [
    {
      "id": "bags",
      "label": "Bags",
      "baseline": 2
    },
    {
      "id": "sand",
      "label": "Sand",
      "baseline": 1
    },
    {
      "id": "barrier",
      "label": "Barrier",
      "baseline": 1
    },
    {
      "id": "team",
      "label": "Team",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "bag_count",
    "label": "Sandbags",
    "unit": "bags",
    "target": 50,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bags",
      "label": "Bags",
      "categories": [
        "bags"
      ]
    },
    {
      "id": "sand",
      "label": "Sand",
      "categories": [
        "sand"
      ]
    },
    {
      "id": "barrier",
      "label": "Barrier",
      "categories": [
        "barrier"
      ]
    },
    {
      "id": "team",
      "label": "Team",
      "categories": [
        "team"
      ]
    }
  ],
  "sample": [
    {
      "id": "sandbag_plan_match-sandbags",
      "name": "Sandbags",
      "category": "bags",
      "tags": [
        "bags"
      ],
      "cost": 60,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_match-sand",
      "name": "Sand",
      "category": "sand",
      "tags": [
        "sand"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_match-barrier-plan",
      "name": "Barrier plan",
      "category": "barrier",
      "tags": [
        "barrier"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "sandbag_plan_match-volunteers",
      "name": "Volunteers",
      "category": "team",
      "tags": [
        "team"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
