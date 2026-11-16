import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-trade-in-index-mcp",
  "title": "Trade-In Archive",
  "description": "Archive trade-in by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "trade_in_index",
  "entity": "trade-in factor archive",
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
    "id": "offer_gap_usd",
    "label": "Offer gap",
    "unit": "USD",
    "target": 1000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 14,
    "budget": 500,
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
      "id": "trade_in_index-market",
      "name": "Market value",
      "category": "valuation",
      "tags": [
        "clean",
        "mid-mileage"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "trade_in_index-dealer",
      "name": "Dealer offer",
      "category": "valuation",
      "tags": [
        "dealer",
        "instant"
      ],
      "cost": 0,
      "quantity": 500,
      "condition": "good"
    },
    {
      "id": "trade_in_index-paint",
      "name": "Paint condition",
      "category": "condition",
      "tags": [
        "small-scratches",
        "original"
      ],
      "cost": 0,
      "quantity": 1200,
      "condition": "fair"
    },
    {
      "id": "trade_in_index-tires",
      "name": "Tire tread",
      "category": "condition",
      "tags": [
        "half-worn",
        "matched"
      ],
      "cost": 0,
      "quantity": 2500,
      "condition": "worn"
    },
    {
      "id": "trade_in_index-history",
      "name": "Service history",
      "category": "history",
      "tags": [
        "complete",
        "dealer"
      ],
      "cost": 0,
      "quantity": 300,
      "condition": "good"
    },
    {
      "id": "trade_in_index-demand",
      "name": "Local demand",
      "category": "demand",
      "tags": [
        "suv",
        "popular"
      ],
      "cost": 0,
      "quantity": 150,
      "condition": "good"
    },
    {
      "id": "trade_in_index-inspection",
      "name": "Inspection fee",
      "category": "fees",
      "tags": [
        "dealer",
        "required"
      ],
      "cost": 75,
      "quantity": 900,
      "condition": "good"
    },
    {
      "id": "trade_in_index-admin",
      "name": "Admin fee",
      "category": "fees",
      "tags": [
        "dealer",
        "documentation"
      ],
      "cost": 0,
      "quantity": 1200,
      "condition": "good"
    }
  ]
}
