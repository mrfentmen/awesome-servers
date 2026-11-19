import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "yard-service-season-log-mcp",
  "title": "Yard Service Season Log Audit",
  "description": "Yard Service Season Log Audit: snow leaf bulk and dump run log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "yard_service",
  "entity": "service",
  "categories": [
    {
      "id": "snow",
      "label": "Snow",
      "baseline": 4
    },
    {
      "id": "leaf",
      "label": "Leaves",
      "baseline": 3
    },
    {
      "id": "bulk",
      "label": "Bulk",
      "baseline": 3
    },
    {
      "id": "dump",
      "label": "Dump runs",
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
        "snow"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "dump"
      ]
    }
  ],
  "sample": [
    {
      "id": "yard_service-sample-1",
      "name": "Sample snow entry",
      "category": "snow",
      "tags": [
        "yard"
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
      "id": "yard_service-sample-2",
      "name": "Sample leaves entry",
      "category": "leaf",
      "tags": [
        "yard"
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
      "id": "yard_service-sample-3",
      "name": "Sample bulk entry",
      "category": "bulk",
      "tags": [
        "yard"
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
      "id": "yard_service-sample-4",
      "name": "Sample dump runs entry",
      "category": "dump",
      "tags": [
        "yard"
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
