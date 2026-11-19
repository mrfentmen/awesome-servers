import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "neighbor-issue-log-mcp",
  "title": "Neighbor Issue Log Audit",
  "description": "Neighbor Issue Log Audit: local noise and issue log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "neighbor_log",
  "entity": "incident",
  "categories": [
    {
      "id": "noise",
      "label": "Noise",
      "baseline": 4
    },
    {
      "id": "parking",
      "label": "Parking",
      "baseline": 3
    },
    {
      "id": "trash",
      "label": "Trash",
      "baseline": 3
    },
    {
      "id": "pets",
      "label": "Pets",
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
        "noise"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "pets"
      ]
    }
  ],
  "sample": [
    {
      "id": "neighbor_log-sample-1",
      "name": "Sample noise entry",
      "category": "noise",
      "tags": [
        "neighbor"
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
      "id": "neighbor_log-sample-2",
      "name": "Sample parking entry",
      "category": "parking",
      "tags": [
        "neighbor"
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
      "id": "neighbor_log-sample-3",
      "name": "Sample trash entry",
      "category": "trash",
      "tags": [
        "neighbor"
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
      "id": "neighbor_log-sample-4",
      "name": "Sample pets entry",
      "category": "pets",
      "tags": [
        "neighbor"
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
