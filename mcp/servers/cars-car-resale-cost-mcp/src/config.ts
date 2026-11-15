import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-resale-cost-mcp",
  "title": "Car Resale Budget Audit",
  "description": "Audit car resale budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_resale_budget",
  "entity": "resale record budget line",
  "categories": [
    {
      "id": "valuation",
      "label": "Valuation",
      "baseline": 1
    },
    {
      "id": "service",
      "label": "Service",
      "baseline": 1
    },
    {
      "id": "condition",
      "label": "Condition",
      "baseline": 1
    },
    {
      "id": "listing",
      "label": "Listing",
      "baseline": 1
    },
    {
      "id": "paperwork",
      "label": "Paperwork",
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
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "price",
      "label": "Price",
      "categories": [
        "valuation"
      ]
    },
    {
      "id": "history",
      "label": "Service history",
      "categories": [
        "service"
      ]
    },
    {
      "id": "condition",
      "label": "Condition",
      "categories": [
        "condition"
      ]
    },
    {
      "id": "advert",
      "label": "Advert",
      "categories": [
        "listing"
      ]
    },
    {
      "id": "documents",
      "label": "Documents",
      "categories": [
        "paperwork"
      ]
    }
  ],
  "sample": [
    {
      "id": "car_resale_budget-market-valuation",
      "name": "Market valuation",
      "category": "valuation",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "car_resale_budget-service-history",
      "name": "Service history",
      "category": "service",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "car_resale_budget-tire-tread",
      "name": "Tire tread",
      "category": "condition",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "car_resale_budget-listing-photos",
      "name": "Listing photos",
      "category": "listing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "car_resale_budget-clean-title",
      "name": "Clean title",
      "category": "paperwork",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "car_resale_budget-paint-correction",
      "name": "Paint correction",
      "category": "condition",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "fair"
    }
  ]
}
