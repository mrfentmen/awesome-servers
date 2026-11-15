import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-subway-access-cost-mcp",
  "title": "Subway Access Budget Audit",
  "description": "Audit subway access budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "subway_access_budget",
  "entity": "station access item budget line",
  "categories": [
    {
      "id": "entrances",
      "label": "Entrances",
      "baseline": 2
    },
    {
      "id": "elevators",
      "label": "Elevators",
      "baseline": 1
    },
    {
      "id": "fare",
      "label": "Fare",
      "baseline": 1
    },
    {
      "id": "transfers",
      "label": "Transfers",
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
    "budget": 600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "entrances",
      "label": "Entrances",
      "categories": [
        "entrances"
      ]
    },
    {
      "id": "elevators",
      "label": "Elevators",
      "categories": [
        "elevators"
      ]
    },
    {
      "id": "fare",
      "label": "Fare",
      "categories": [
        "fare"
      ]
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "categories": [
        "transfers"
      ]
    }
  ],
  "sample": [
    {
      "id": "subway_access_budget_budget-station-access-survey",
      "name": "Station access survey",
      "category": "entrances",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "subway_access_budget_budget-elevator-repair-fund",
      "name": "Elevator repair fund",
      "category": "elevators",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "subway_access_budget_budget-omny-card",
      "name": "OMNY card",
      "category": "fare",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "subway_access_budget_budget-transfer-route-map",
      "name": "Transfer route map",
      "category": "transfers",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
