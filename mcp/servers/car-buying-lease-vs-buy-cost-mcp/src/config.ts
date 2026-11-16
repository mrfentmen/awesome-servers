import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-lease-vs-buy-cost-mcp",
  "title": "Lease vs Buy Budget Audit",
  "description": "Audit lease vs buy budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lease_vs_buy_budget",
  "entity": "ownership option budget line",
  "categories": [
    {
      "id": "lease",
      "label": "Lease",
      "baseline": 2
    },
    {
      "id": "finance",
      "label": "Finance",
      "baseline": 2
    },
    {
      "id": "cash",
      "label": "Cash",
      "baseline": 1
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 1
    },
    {
      "id": "maintenance",
      "label": "Maintenance",
      "baseline": 1
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
    "budget": 171250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lease",
      "label": "Lease path",
      "categories": [
        "lease"
      ]
    },
    {
      "id": "finance",
      "label": "Finance path",
      "categories": [
        "finance"
      ]
    },
    {
      "id": "cash",
      "label": "Cash path",
      "categories": [
        "cash"
      ]
    },
    {
      "id": "ownership",
      "label": "Ownership costs",
      "categories": [
        "insurance",
        "maintenance"
      ]
    }
  ],
  "sample": [
    {
      "id": "lease_vs_buy_budget-36-month-lease",
      "name": "36-month lease",
      "category": "lease",
      "tags": [
        "budget"
      ],
      "cost": 18500,
      "quantity": 18500,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-48-month-lease",
      "name": "48-month lease",
      "category": "lease",
      "tags": [
        "budget"
      ],
      "cost": 22000,
      "quantity": 22000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-60-month-finance",
      "name": "60-month finance",
      "category": "finance",
      "tags": [
        "budget"
      ],
      "cost": 27000,
      "quantity": 27000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-72-month-finance",
      "name": "72-month finance",
      "category": "finance",
      "tags": [
        "budget"
      ],
      "cost": 29500,
      "quantity": 29500,
      "condition": "fair"
    },
    {
      "id": "lease_vs_buy_budget-cash-purchase",
      "name": "Cash purchase",
      "category": "cash",
      "tags": [
        "budget"
      ],
      "cost": 24000,
      "quantity": 24000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-five-year-insurance",
      "name": "Five-year insurance",
      "category": "insurance",
      "tags": [
        "budget"
      ],
      "cost": 6500,
      "quantity": 6500,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-five-year-maintenance",
      "name": "Five-year maintenance",
      "category": "maintenance",
      "tags": [
        "budget"
      ],
      "cost": 3200,
      "quantity": 3200,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_budget-estimated-resale",
      "name": "Estimated resale",
      "category": "cash",
      "tags": [
        "budget"
      ],
      "cost": 12000,
      "quantity": 12000,
      "condition": "good"
    }
  ]
}
