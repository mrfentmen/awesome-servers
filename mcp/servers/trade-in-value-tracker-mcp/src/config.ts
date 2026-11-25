import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "trade-in-value-tracker-mcp",
  "title": "trade-in-value tracker Tracker",
  "description": "Real local JSON analysis of trade-in-value tracker in the Auto Buying & Ownership lane. 25 MCP tools, no paywall.",
  "prefix": "auto_trade_in_value_tracker",
  "entity": "trade-in-value tracker item",
  "categories": [
    {
      "id": "auto",
      "label": "auto",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "trade-in-value",
      "label": "trade-in-value",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "auto"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "auto_trade_in_value_tracker-auto-1",
      "name": "auto primary",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-trade-in-value-3",
      "name": "trade-in-value primary",
      "category": "trade-in-value",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-auto-5",
      "name": "auto backup",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-trade-in-value-7",
      "name": "trade-in-value backup",
      "category": "trade-in-value",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
      "id": "auto_trade_in_value_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "trade",
        "in"
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
