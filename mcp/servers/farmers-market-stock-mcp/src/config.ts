import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "farmers-market-stock-mcp",
  "title": "Farmers Market Stock Audit",
  "description": "Farmers Market Stock Audit: track market-day stock and vendors. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "market_stock",
  "entity": "stall item",
  "categories": [
    {
      "id": "veg",
      "label": "Vegetables",
      "baseline": 4
    },
    {
      "id": "fruit",
      "label": "Fruit",
      "baseline": 3
    },
    {
      "id": "dairy",
      "label": "Dairy and eggs",
      "baseline": 3
    },
    {
      "id": "baked",
      "label": "Baked goods",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "veg"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "baked"
      ]
    }
  ],
  "sample": [
    {
      "id": "market_stock-sample-1",
      "name": "Sample vegetables entry",
      "category": "veg",
      "tags": [
        "farmers-market"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "market_stock-sample-2",
      "name": "Sample fruit entry",
      "category": "fruit",
      "tags": [
        "farmers-market"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "market_stock-sample-3",
      "name": "Sample dairy and eggs entry",
      "category": "dairy",
      "tags": [
        "farmers-market"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "market_stock-sample-4",
      "name": "Sample baked goods entry",
      "category": "baked",
      "tags": [
        "farmers-market"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
