import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "trade-school-cost-compare-mcp",
  "title": "Trade School Cost Compare Audit",
  "description": "Trade School Cost Compare Audit: compare CDL pilot and trade program cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "trade_school",
  "entity": "program",
  "categories": [
    {
      "id": "cdl",
      "label": "CDL",
      "baseline": 4
    },
    {
      "id": "pilot",
      "label": "Pilot",
      "baseline": 3
    },
    {
      "id": "electric",
      "label": "Electrical",
      "baseline": 3
    },
    {
      "id": "plumbing",
      "label": "Plumbing",
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
        "cdl"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "plumbing"
      ]
    }
  ],
  "sample": [
    {
      "id": "trade_school-sample-1",
      "name": "Sample cdl entry",
      "category": "cdl",
      "tags": [
        "trade-school"
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
      "id": "trade_school-sample-2",
      "name": "Sample pilot entry",
      "category": "pilot",
      "tags": [
        "trade-school"
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
      "id": "trade_school-sample-3",
      "name": "Sample electrical entry",
      "category": "electric",
      "tags": [
        "trade-school"
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
      "id": "trade_school-sample-4",
      "name": "Sample plumbing entry",
      "category": "plumbing",
      "tags": [
        "trade-school"
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
