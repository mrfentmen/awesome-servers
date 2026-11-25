import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "warehouse-shift-tracker-mcp",
  "title": "warehouse shift tracker Tracker",
  "description": "Real local JSON analysis of warehouse shift tracker in the Work & Trades lane. 25 MCP tools, no paywall.",
  "prefix": "work_warehouse_shift_tracker",
  "entity": "warehouse shift tracker item",
  "categories": [
    {
      "id": "work",
      "label": "work",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "warehouse-shift",
      "label": "warehouse-shift",
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
        "work"
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
      "id": "work_warehouse_shift_tracker-work-1",
      "name": "work primary",
      "category": "work",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-warehouse-shift-3",
      "name": "warehouse-shift primary",
      "category": "warehouse-shift",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-work-5",
      "name": "work backup",
      "category": "work",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-warehouse-shift-7",
      "name": "warehouse-shift backup",
      "category": "warehouse-shift",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
      "id": "work_warehouse_shift_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "work-trades",
        "warehouse",
        "shift"
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
