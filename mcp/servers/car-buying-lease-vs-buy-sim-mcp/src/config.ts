import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-lease-vs-buy-sim-mcp",
  "title": "Lease vs Buy Simulator",
  "description": "Simulate lease vs buy by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lease_vs_buy_sim",
  "entity": "ownership option simulation",
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
    "id": "five_year_cost_usd",
    "label": "Five-year cost",
    "unit": "USD",
    "target": 30000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 12,
    "budget": 35000,
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
      "id": "lease_vs_buy_sim-lease-36",
      "name": "36-month lease",
      "category": "lease",
      "tags": [
        "low-mileage",
        "closed-end"
      ],
      "cost": 18500,
      "quantity": 18500,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-lease-48",
      "name": "48-month lease",
      "category": "lease",
      "tags": [
        "mid-mileage",
        "closed-end"
      ],
      "cost": 22000,
      "quantity": 22000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-finance-60",
      "name": "60-month finance",
      "category": "finance",
      "tags": [
        "bank",
        "new"
      ],
      "cost": 27000,
      "quantity": 27000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-finance-72",
      "name": "72-month finance",
      "category": "finance",
      "tags": [
        "bank",
        "new"
      ],
      "cost": 29500,
      "quantity": 29500,
      "condition": "fair"
    },
    {
      "id": "lease_vs_buy_sim-cash",
      "name": "Cash purchase",
      "category": "cash",
      "tags": [
        "savings",
        "new"
      ],
      "cost": 24000,
      "quantity": 24000,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-insurance",
      "name": "Five-year insurance",
      "category": "insurance",
      "tags": [
        "full-cover",
        "clean-record"
      ],
      "cost": 6500,
      "quantity": 6500,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-maintenance",
      "name": "Five-year maintenance",
      "category": "maintenance",
      "tags": [
        "scheduled",
        "wear"
      ],
      "cost": 3200,
      "quantity": 3200,
      "condition": "good"
    },
    {
      "id": "lease_vs_buy_sim-resale",
      "name": "Estimated resale",
      "category": "cash",
      "tags": [
        "five-year",
        "trade-in"
      ],
      "cost": 12000,
      "quantity": 12000,
      "condition": "good"
    }
  ]
}
