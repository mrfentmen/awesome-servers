import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "inspection-log-guide-mcp",
  "title": "inspection log guide Guide",
  "description": "Real local JSON analysis of inspection log guide in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_inspection_log_guide",
  "entity": "inspection log guide item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "inspection-log",
      "label": "inspection-log",
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
      "id": "build_inspection_log_guide-build-1",
      "name": "build primary",
      "category": "build",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-inspection-log-3",
      "name": "inspection-log primary",
      "category": "inspection-log",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-build-5",
      "name": "build backup",
      "category": "build",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-inspection-log-7",
      "name": "inspection-log backup",
      "category": "inspection-log",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
      "id": "build_inspection_log_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "build-factory",
        "inspection",
        "log"
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
