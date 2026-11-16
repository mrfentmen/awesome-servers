import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-trade-in-cost-mcp",
  "title": "Trade-In Budget Audit",
  "description": "Audit trade-in budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "trade_in_budget",
  "entity": "trade-in factor budget line",
  "categories": [
    {
      "id": "valuation",
      "label": "Valuation",
      "baseline": 2
    },
    {
      "id": "condition",
      "label": "Condition",
      "baseline": 2
    },
    {
      "id": "history",
      "label": "History",
      "baseline": 1
    },
    {
      "id": "demand",
      "label": "Demand",
      "baseline": 1
    },
    {
      "id": "fees",
      "label": "Fees",
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "valuation",
      "label": "Valuation path",
      "categories": [
        "valuation"
      ]
    },
    {
      "id": "condition",
      "label": "Condition path",
      "categories": [
        "condition"
      ]
    },
    {
      "id": "history",
      "label": "History path",
      "categories": [
        "history"
      ]
    },
    {
      "id": "market",
      "label": "Market path",
      "categories": [
        "demand",
        "fees"
      ]
    }
  ],
  "sample": [
    {
      "id": "trade_in_budget-market-value",
      "name": "Market value",
      "category": "valuation",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "trade_in_budget-dealer-offer",
      "name": "Dealer offer",
      "category": "valuation",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "trade_in_budget-paint-condition",
      "name": "Paint condition",
      "category": "condition",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "trade_in_budget-tire-tread",
      "name": "Tire tread",
      "category": "condition",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "trade_in_budget-service-history",
      "name": "Service history",
      "category": "history",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "trade_in_budget-local-demand",
      "name": "Local demand",
      "category": "demand",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "trade_in_budget-inspection-fee",
      "name": "Inspection fee",
      "category": "fees",
      "tags": [
        "budget"
      ],
      "cost": 75,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "trade_in_budget-admin-fee",
      "name": "Admin fee",
      "category": "fees",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
