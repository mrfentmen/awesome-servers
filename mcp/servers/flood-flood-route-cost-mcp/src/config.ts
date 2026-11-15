import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-route-cost-mcp",
  "title": "Flood Route Budget Audit",
  "description": "Audit flood route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_route_budget",
  "entity": "flood route item budget line",
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
      "id": "high-ground",
      "label": "High ground",
      "baseline": 1
    },
    {
      "id": "comms",
      "label": "Comms",
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
    "budget": 50,
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
      "id": "high-ground",
      "label": "High ground",
      "categories": [
        "high-ground"
      ]
    },
    {
      "id": "comms",
      "label": "Comms",
      "categories": [
        "comms"
      ]
    }
  ],
  "sample": [
    {
      "id": "flood_route_budget-route-survey",
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
      "id": "flood_route_budget-backup-route-map",
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
      "id": "flood_route_budget-high-ground-plan",
      "name": "High-ground plan",
      "category": "high-ground",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "flood_route_budget-radio",
      "name": "Radio",
      "category": "comms",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
