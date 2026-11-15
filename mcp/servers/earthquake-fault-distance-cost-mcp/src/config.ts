import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-fault-distance-cost-mcp",
  "title": "Fault Distance Budget Audit",
  "description": "Audit fault distance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fault_distance_budget",
  "entity": "distance check budget line",
  "categories": [
    {
      "id": "home",
      "label": "Home",
      "baseline": 2
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "shelter",
      "label": "Shelter",
      "baseline": 1
    },
    {
      "id": "supplies",
      "label": "Supplies",
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
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "home",
      "label": "Home",
      "categories": [
        "home"
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
      "id": "shelter",
      "label": "Shelter",
      "categories": [
        "shelter"
      ]
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "fault_distance_budget-fault-map",
      "name": "Fault map",
      "category": "home",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "fault_distance_budget-route-fuel",
      "name": "Route fuel",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "fault_distance_budget-shelter-kit",
      "name": "Shelter kit",
      "category": "shelter",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "fault_distance_budget-emergency-radio",
      "name": "Emergency radio",
      "category": "supplies",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    }
  ]
}
