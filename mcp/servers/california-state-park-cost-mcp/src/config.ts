import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-state-park-cost-mcp",
  "title": "State Park Budget Audit",
  "description": "Audit state park budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "state_park_budget",
  "entity": "park item budget line",
  "categories": [
    {
      "id": "access",
      "label": "Access",
      "baseline": 2
    },
    {
      "id": "trail",
      "label": "Trail",
      "baseline": 1
    },
    {
      "id": "wildlife",
      "label": "Wildlife",
      "baseline": 1
    },
    {
      "id": "permit",
      "label": "Permit",
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
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "trail",
      "label": "Trail",
      "categories": [
        "trail"
      ]
    },
    {
      "id": "wildlife",
      "label": "Wildlife",
      "categories": [
        "wildlife"
      ]
    },
    {
      "id": "permit",
      "label": "Permit",
      "categories": [
        "permit"
      ]
    }
  ],
  "sample": [
    {
      "id": "state_park_budget-park-pass",
      "name": "Park pass",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "state_park_budget-trail-map",
      "name": "Trail map",
      "category": "trail",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "state_park_budget-wildlife-guide",
      "name": "Wildlife guide",
      "category": "wildlife",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "state_park_budget-park-permit",
      "name": "Park permit",
      "category": "permit",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
