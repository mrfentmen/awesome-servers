import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-insurance-quote-sim-mcp",
  "title": "Insurance Quote Simulator",
  "description": "Simulate insurance quote by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "insurance_quote_sim",
  "entity": "insurance quote simulation",
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
    "id": "annual_premium_usd",
    "label": "Annual premium",
    "unit": "USD",
    "target": 1200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 2200,
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
      "id": "insurance_quote_sim-base",
      "name": "Base quote",
      "category": "liability",
      "tags": [
        "state-minimum",
        "clean-record"
      ],
      "cost": 980,
      "quantity": 980,
      "condition": "good"
    },
    {
      "id": "insurance_quote_sim-mid",
      "name": "Mid quote",
      "category": "collision",
      "tags": [
        "collision",
        "clean-record"
      ],
      "cost": 1120,
      "quantity": 1120,
      "condition": "good"
    },
    {
      "id": "insurance_quote_sim-premium",
      "name": "Premium quote",
      "category": "comprehensive",
      "tags": [
        "comprehensive",
        "low-deductible"
      ],
      "cost": 1450,
      "quantity": 1450,
      "condition": "fair"
    },
    {
      "id": "insurance_quote_sim-high",
      "name": "High-risk quote",
      "category": "comprehensive",
      "tags": [
        "comprehensive",
        "claim-history"
      ],
      "cost": 1780,
      "quantity": 1780,
      "condition": "worn"
    },
    {
      "id": "insurance_quote_sim-uninsured",
      "name": "Uninsured motorist",
      "category": "uninsured",
      "tags": [
        "add-on",
        "state"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "insurance_quote_sim-roadside",
      "name": "Roadside assistance",
      "category": "extras",
      "tags": [
        "add-on",
        "tow"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "insurance_quote_sim-rental",
      "name": "Rental reimbursement",
      "category": "extras",
      "tags": [
        "add-on",
        "repair"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "insurance_quote_sim-umbrella",
      "name": "Umbrella policy",
      "category": "liability",
      "tags": [
        "add-on",
        "liability"
      ],
      "cost": 240,
      "quantity": 240,
      "condition": "good"
    }
  ]
}
