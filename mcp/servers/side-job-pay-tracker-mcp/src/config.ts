import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "side-job-pay-tracker-mcp",
  "title": "Side Job Pay Tracker Audit",
  "description": "Side Job Pay Tracker Audit: odd job cash log and rates. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "side_job",
  "entity": "job",
  "categories": [
    {
      "id": "yard",
      "label": "Yard",
      "baseline": 4
    },
    {
      "id": "clean",
      "label": "Cleaning",
      "baseline": 3
    },
    {
      "id": "fix",
      "label": "Fixing",
      "baseline": 3
    },
    {
      "id": "delivery",
      "label": "Delivery",
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
        "yard"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "delivery"
      ]
    }
  ],
  "sample": [
    {
      "id": "side_job-sample-1",
      "name": "Sample yard entry",
      "category": "yard",
      "tags": [
        "side-job"
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
      "id": "side_job-sample-2",
      "name": "Sample cleaning entry",
      "category": "clean",
      "tags": [
        "side-job"
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
      "id": "side_job-sample-3",
      "name": "Sample fixing entry",
      "category": "fix",
      "tags": [
        "side-job"
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
      "id": "side_job-sample-4",
      "name": "Sample delivery entry",
      "category": "delivery",
      "tags": [
        "side-job"
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
