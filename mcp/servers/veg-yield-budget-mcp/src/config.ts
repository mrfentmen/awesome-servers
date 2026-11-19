import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "veg-yield-budget-mcp",
  "title": "Veg Yield Budget Audit",
  "description": "Veg Yield Budget Audit: turn yield and refuse figures into buy amounts and cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "veg_yield",
  "entity": "buy lot",
  "categories": [
    {
      "id": "leafy",
      "label": "Leafy veg",
      "baseline": 4
    },
    {
      "id": "root",
      "label": "Roots",
      "baseline": 3
    },
    {
      "id": "fruitveg",
      "label": "Fruit veg",
      "baseline": 3
    },
    {
      "id": "herbs",
      "label": "Herbs",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 25,
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
        "leafy"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "herbs"
      ]
    }
  ],
  "sample": [
    {
      "id": "veg_yield-sample-1",
      "name": "Sample leafy veg entry",
      "category": "leafy",
      "tags": [
        "vegetable"
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
      "id": "veg_yield-sample-2",
      "name": "Sample roots entry",
      "category": "root",
      "tags": [
        "vegetable"
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
      "id": "veg_yield-sample-3",
      "name": "Sample fruit veg entry",
      "category": "fruitveg",
      "tags": [
        "vegetable"
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
      "id": "veg_yield-sample-4",
      "name": "Sample herbs entry",
      "category": "herbs",
      "tags": [
        "vegetable"
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
