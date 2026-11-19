import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tea-iced-tea-batch-compare-mcp",
  "title": "Iced Tea Batch Compare",
  "description": "Real local JSON analysis of iced tea batch in the Tea lane. 25 MCP tools, no paywall.",
  "prefix": "tea_tea_iced_tea_batch_compare",
  "entity": "iced tea batch item",
  "categories": [
    {
      "id": "options",
      "label": "Options",
      "baseline": 2
    },
    {
      "id": "prices",
      "label": "Prices",
      "baseline": 2
    },
    {
      "id": "pros",
      "label": "Pros",
      "baseline": 2
    },
    {
      "id": "cons",
      "label": "Cons",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "options"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "cons"
      ]
    }
  ],
  "sample": [
    {
      "id": "tea_tea_iced_tea_batch_compare-options-1",
      "name": "Options primary",
      "category": "options",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-pros-3",
      "name": "Pros primary",
      "category": "pros",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-cons-4",
      "name": "Cons primary",
      "category": "cons",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-options-5",
      "name": "Options backup",
      "category": "options",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-prices-6",
      "name": "Prices backup",
      "category": "prices",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-pros-7",
      "name": "Pros backup",
      "category": "pros",
      "tags": [
        "tea",
        "tea",
        "iced"
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
      "id": "tea_tea_iced_tea_batch_compare-cons-8",
      "name": "Cons backup",
      "category": "cons",
      "tags": [
        "tea",
        "tea",
        "iced"
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
