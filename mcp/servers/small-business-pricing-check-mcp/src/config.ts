import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-business-pricing-check-mcp",
  "title": "Pricing Audit",
  "description": "Audit pricing by cost, margin, market, discount coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "small_business_pricing",
  "entity": "pricing item",
  "categories": [
    {
      "id": "cost",
      "label": "Cost",
      "baseline": 2
    },
    {
      "id": "margin",
      "label": "Margin",
      "baseline": 2
    },
    {
      "id": "market",
      "label": "Market",
      "baseline": 2
    },
    {
      "id": "discount",
      "label": "Discount",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "cost"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "discount"
      ]
    }
  ],
  "sample": [
    {
      "id": "small_business_pricing-cost-1",
      "name": "Cost primary",
      "category": "cost",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-margin-2",
      "name": "Margin primary",
      "category": "margin",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-market-3",
      "name": "Market primary",
      "category": "market",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-discount-4",
      "name": "Discount primary",
      "category": "discount",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-cost-5",
      "name": "Cost backup",
      "category": "cost",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-margin-6",
      "name": "Margin backup",
      "category": "margin",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-market-7",
      "name": "Market backup",
      "category": "market",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_pricing-discount-8",
      "name": "Discount backup",
      "category": "discount",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
