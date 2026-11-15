import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-aftershock-plan-cost-mcp",
  "title": "Aftershock Plan Budget Audit",
  "description": "Audit aftershock plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "aftershock_plan_budget",
  "entity": "aftershock item budget line",
  "categories": [
    {
      "id": "route",
      "label": "Route",
      "baseline": 2
    },
    {
      "id": "comms",
      "label": "Comms",
      "baseline": 1
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "baseline": 1
    },
    {
      "id": "meeting",
      "label": "Meeting",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "comms",
      "label": "Comms",
      "categories": [
        "comms"
      ]
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "categories": [
        "supplies"
      ]
    },
    {
      "id": "meeting",
      "label": "Meeting",
      "categories": [
        "meeting"
      ]
    }
  ],
  "sample": [
    {
      "id": "aftershock_plan_budget-route-map",
      "name": "Route map",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "aftershock_plan_budget-hand-radio",
      "name": "Hand radio",
      "category": "comms",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "aftershock_plan_budget-go-bag",
      "name": "Go bag",
      "category": "supplies",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "aftershock_plan_budget-meeting-plan",
      "name": "Meeting plan",
      "category": "meeting",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
