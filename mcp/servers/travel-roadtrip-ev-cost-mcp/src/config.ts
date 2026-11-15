import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-roadtrip-ev-cost-mcp",
  "title": "Road Trip EV Budget Audit",
  "description": "Audit road trip ev budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roadtrip_ev_budget",
  "entity": "EV trip item budget line",
  "categories": [
    {
      "id": "charger",
      "label": "Chargers",
      "baseline": 2
    },
    {
      "id": "route",
      "label": "Routes",
      "baseline": 2
    },
    {
      "id": "vehicle",
      "label": "Vehicle",
      "baseline": 1
    },
    {
      "id": "plan",
      "label": "Backup plans",
      "baseline": 2
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "charger",
      "label": "Charging stop",
      "categories": [
        "charger"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "vehicle",
      "label": "Vehicle",
      "categories": [
        "vehicle"
      ]
    },
    {
      "id": "plan",
      "label": "Backup plan",
      "categories": [
        "plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "roadtrip_ev_budget-fast-charger-stop",
      "name": "Fast charger stop",
      "category": "charger",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "roadtrip_ev_budget-highway-route",
      "name": "Highway route",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "roadtrip_ev_budget-long-range-ev",
      "name": "Long-range EV",
      "category": "vehicle",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "roadtrip_ev_budget-backup-charger",
      "name": "Backup charger",
      "category": "plan",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
