import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "warehouse-bin-tracker-mcp",
  "title": "warehouse bin tracker Tracker",
  "description": "Real local JSON analysis of warehouse bin tracker in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_warehouse_bin_tracker",
  "entity": "warehouse bin tracker item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "warehouse-bin",
      "label": "warehouse-bin",
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
        "build"
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
      "id": "build_warehouse_bin_tracker-build-1",
      "name": "build primary",
      "category": "build",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-warehouse-bin-3",
      "name": "warehouse-bin primary",
      "category": "warehouse-bin",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-build-5",
      "name": "build backup",
      "category": "build",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-warehouse-bin-7",
      "name": "warehouse-bin backup",
      "category": "warehouse-bin",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
      "id": "build_warehouse_bin_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "build-factory",
        "warehouse",
        "bin"
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
