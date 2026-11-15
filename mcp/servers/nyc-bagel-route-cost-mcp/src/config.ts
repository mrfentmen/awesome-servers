import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-bagel-route-cost-mcp",
  "title": "Bagel Route Budget Audit",
  "description": "Audit bagel route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bagel_route_budget",
  "entity": "bagel stop budget line",
  "categories": [
    {
      "id": "stops",
      "label": "Stops",
      "baseline": 2
    },
    {
      "id": "walk",
      "label": "Walk",
      "baseline": 1
    },
    {
      "id": "freshness",
      "label": "Freshness",
      "baseline": 1
    },
    {
      "id": "budget",
      "label": "Budget",
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
      "id": "stops",
      "label": "Stops",
      "categories": [
        "stops"
      ]
    },
    {
      "id": "walk",
      "label": "Walk",
      "categories": [
        "walk"
      ]
    },
    {
      "id": "freshness",
      "label": "Freshness",
      "categories": [
        "freshness"
      ]
    },
    {
      "id": "budget",
      "label": "Budget",
      "categories": [
        "budget"
      ]
    }
  ],
  "sample": [
    {
      "id": "bagel_route_budget_budget-bagels",
      "name": "Bagels",
      "category": "stops",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "new"
    },
    {
      "id": "bagel_route_budget_budget-coffee",
      "name": "Coffee",
      "category": "walk",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "new"
    },
    {
      "id": "bagel_route_budget_budget-walk-route",
      "name": "Walk route",
      "category": "freshness",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "bagel_route_budget_budget-backup-stop",
      "name": "Backup stop",
      "category": "budget",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    }
  ]
}
