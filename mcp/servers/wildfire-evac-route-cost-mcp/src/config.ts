import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-evac-route-cost-mcp",
  "title": "Evacuation Route Budget Audit",
  "description": "Audit evacuation route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "evac_route_budget",
  "entity": "evacuation item budget line",
  "categories": [
    {
      "id": "primary",
      "label": "Primary",
      "baseline": 2
    },
    {
      "id": "backup",
      "label": "Backup",
      "baseline": 1
    },
    {
      "id": "go-bag",
      "label": "Go bag",
      "baseline": 1
    },
    {
      "id": "alerts",
      "label": "Alerts",
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
      "id": "primary",
      "label": "Primary",
      "categories": [
        "primary"
      ]
    },
    {
      "id": "backup",
      "label": "Backup",
      "categories": [
        "backup"
      ]
    },
    {
      "id": "go-bag",
      "label": "Go bag",
      "categories": [
        "go-bag"
      ]
    },
    {
      "id": "alerts",
      "label": "Alerts",
      "categories": [
        "alerts"
      ]
    }
  ],
  "sample": [
    {
      "id": "evac_route_budget-route-survey",
      "name": "Route survey",
      "category": "primary",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "evac_route_budget-backup-route-map",
      "name": "Backup route map",
      "category": "backup",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "evac_route_budget-go-bag",
      "name": "Go bag",
      "category": "go-bag",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "evac_route_budget-alert-setup",
      "name": "Alert setup",
      "category": "alerts",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
