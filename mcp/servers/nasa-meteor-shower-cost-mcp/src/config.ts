import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-meteor-shower-cost-mcp",
  "title": "Meteor Shower Budget Audit",
  "description": "Audit meteor shower budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "meteor_shower_budget",
  "entity": "shower plan budget line",
  "categories": [
    {
      "id": "peak",
      "label": "Peak",
      "baseline": 2
    },
    {
      "id": "radiant",
      "label": "Radiant",
      "baseline": 1
    },
    {
      "id": "site",
      "label": "Site",
      "baseline": 1
    },
    {
      "id": "gear",
      "label": "Gear",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "peak",
      "label": "Peak",
      "categories": [
        "peak"
      ]
    },
    {
      "id": "radiant",
      "label": "Radiant",
      "categories": [
        "radiant"
      ]
    },
    {
      "id": "site",
      "label": "Site",
      "categories": [
        "site"
      ]
    },
    {
      "id": "gear",
      "label": "Gear",
      "categories": [
        "gear"
      ]
    }
  ],
  "sample": [
    {
      "id": "meteor_shower_budget_budget-park-pass",
      "name": "Park pass",
      "category": "peak",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "meteor_shower_budget_budget-blanket",
      "name": "Blanket",
      "category": "radiant",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "meteor_shower_budget_budget-red-flashlight",
      "name": "Red flashlight",
      "category": "site",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "meteor_shower_budget_budget-thermos",
      "name": "Thermos",
      "category": "gear",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    }
  ]
}
