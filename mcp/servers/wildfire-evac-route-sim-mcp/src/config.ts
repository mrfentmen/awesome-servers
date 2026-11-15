import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-evac-route-sim-mcp",
  "title": "Evacuation Route Simulator",
  "description": "Simulate evacuation route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "evac_route_sim",
  "entity": "evacuation item simulation",
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
    "id": "route_options",
    "label": "Route options",
    "unit": "routes",
    "target": 2,
    "direction": "higher"
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
      "id": "evac_route_sim-primary-route",
      "name": "Primary route",
      "category": "primary",
      "tags": [
        "primary"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "evac_route_sim-backup-route",
      "name": "Backup route",
      "category": "backup",
      "tags": [
        "backup"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "evac_route_sim-go-bag",
      "name": "Go bag",
      "category": "go-bag",
      "tags": [
        "go-bag"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "evac_route_sim-alert-signup",
      "name": "Alert signup",
      "category": "alerts",
      "tags": [
        "alerts"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
