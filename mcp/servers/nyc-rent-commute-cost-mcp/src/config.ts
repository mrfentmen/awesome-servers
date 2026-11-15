import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-rent-commute-cost-mcp",
  "title": "Rent Commute Budget Audit",
  "description": "Audit rent commute budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rent_commute_budget",
  "entity": "commute option budget line",
  "categories": [
    {
      "id": "rent",
      "label": "Rent",
      "baseline": 2
    },
    {
      "id": "commute",
      "label": "Commute",
      "baseline": 1
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "baseline": 1
    },
    {
      "id": "pass",
      "label": "Pass",
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
    "budget": 3400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "rent",
      "label": "Rent",
      "categories": [
        "rent"
      ]
    },
    {
      "id": "commute",
      "label": "Commute",
      "categories": [
        "commute"
      ]
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "categories": [
        "transfers"
      ]
    },
    {
      "id": "pass",
      "label": "Pass",
      "categories": [
        "pass"
      ]
    }
  ],
  "sample": [
    {
      "id": "rent_commute_budget_budget-rent-deposit",
      "name": "Rent deposit",
      "category": "rent",
      "tags": [
        "budget"
      ],
      "cost": 2400,
      "quantity": 2400,
      "condition": "new"
    },
    {
      "id": "rent_commute_budget_budget-metro-pass",
      "name": "Metro pass",
      "category": "commute",
      "tags": [
        "budget"
      ],
      "cost": 132,
      "quantity": 132,
      "condition": "new"
    },
    {
      "id": "rent_commute_budget_budget-moving-van",
      "name": "Moving van",
      "category": "transfers",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "rent_commute_budget_budget-commute-trial",
      "name": "Commute trial",
      "category": "pass",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
