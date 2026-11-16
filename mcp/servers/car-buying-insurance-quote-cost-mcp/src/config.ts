import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-insurance-quote-cost-mcp",
  "title": "Insurance Quote Budget Audit",
  "description": "Audit insurance quote budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "insurance_quote_budget",
  "entity": "insurance quote budget line",
  "categories": [
    {
      "id": "collision",
      "label": "Collision",
      "baseline": 2
    },
    {
      "id": "comprehensive",
      "label": "Comprehensive",
      "baseline": 2
    },
    {
      "id": "liability",
      "label": "Liability",
      "baseline": 2
    },
    {
      "id": "uninsured",
      "label": "Uninsured",
      "baseline": 1
    },
    {
      "id": "extras",
      "label": "Extras",
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
    "budget": 7050,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "collision",
      "label": "Collision cover",
      "categories": [
        "collision"
      ]
    },
    {
      "id": "comprehensive",
      "label": "Comprehensive cover",
      "categories": [
        "comprehensive"
      ]
    },
    {
      "id": "liability",
      "label": "Liability cover",
      "categories": [
        "liability",
        "uninsured"
      ]
    },
    {
      "id": "extras",
      "label": "Optional extras",
      "categories": [
        "extras"
      ]
    }
  ],
  "sample": [
    {
      "id": "insurance_quote_budget-base-quote",
      "name": "Base quote",
      "category": "liability",
      "tags": [
        "budget"
      ],
      "cost": 980,
      "quantity": 980,
      "condition": "good"
    },
    {
      "id": "insurance_quote_budget-mid-quote",
      "name": "Mid quote",
      "category": "collision",
      "tags": [
        "budget"
      ],
      "cost": 1120,
      "quantity": 1120,
      "condition": "good"
    },
    {
      "id": "insurance_quote_budget-premium-quote",
      "name": "Premium quote",
      "category": "comprehensive",
      "tags": [
        "budget"
      ],
      "cost": 1450,
      "quantity": 1450,
      "condition": "fair"
    },
    {
      "id": "insurance_quote_budget-high-risk-quote",
      "name": "High-risk quote",
      "category": "comprehensive",
      "tags": [
        "budget"
      ],
      "cost": 1780,
      "quantity": 1780,
      "condition": "worn"
    },
    {
      "id": "insurance_quote_budget-uninsured-motorist",
      "name": "Uninsured motorist",
      "category": "uninsured",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "insurance_quote_budget-roadside-assistance",
      "name": "Roadside assistance",
      "category": "extras",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "insurance_quote_budget-rental-reimbursement",
      "name": "Rental reimbursement",
      "category": "extras",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "insurance_quote_budget-umbrella-policy",
      "name": "Umbrella policy",
      "category": "liability",
      "tags": [
        "budget"
      ],
      "cost": 240,
      "quantity": 240,
      "condition": "good"
    }
  ]
}
