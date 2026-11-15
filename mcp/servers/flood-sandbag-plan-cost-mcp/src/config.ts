import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-sandbag-plan-cost-mcp",
  "title": "Sandbag Plan Budget Audit",
  "description": "Audit sandbag plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sandbag_plan_budget",
  "entity": "sandbag item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
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
      "id": "sandbag_plan_budget-sandbags",
      "name": "Sandbags",
      "category": "bags",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_budget-sand",
      "name": "Sand",
      "category": "sand",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_budget-barrier-plan",
      "name": "Barrier plan",
      "category": "barrier",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_budget-volunteer-coordination",
      "name": "Volunteer coordination",
      "category": "team",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
