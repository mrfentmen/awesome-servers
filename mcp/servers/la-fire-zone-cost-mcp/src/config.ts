import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-fire-zone-cost-mcp",
  "title": "Wildfire Zone Budget Audit",
  "description": "Audit wildfire zone budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fire_zone_budget",
  "entity": "fire zone item budget line",
  "categories": [
    {
      "id": "zone",
      "label": "Zone",
      "baseline": 2
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "insurance",
      "label": "Insurance",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "zone",
      "label": "Zone",
      "categories": [
        "zone"
      ]
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "categories": [
        "defensible-space"
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
      "id": "insurance",
      "label": "Insurance",
      "categories": [
        "insurance"
      ]
    }
  ],
  "sample": [
    {
      "id": "fire_zone_budget_budget-zone-report",
      "name": "Zone report",
      "category": "zone",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "fire_zone_budget_budget-brush-clearing",
      "name": "Brush clearing",
      "category": "defensible-space",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "fire_zone_budget_budget-go-bag",
      "name": "Go bag",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "fire_zone_budget_budget-insurance-review",
      "name": "Insurance review",
      "category": "insurance",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
