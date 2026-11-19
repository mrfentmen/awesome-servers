import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "hoa-fee-rule-tracker-mcp",
  "title": "HOA Fee Rule Tracker Audit",
  "description": "HOA Fee Rule Tracker Audit: track HOA fees rules and docs. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hoa_tracker",
  "entity": "record",
  "categories": [
    {
      "id": "fees",
      "label": "Fees",
      "baseline": 4
    },
    {
      "id": "rules",
      "label": "Rules",
      "baseline": 3
    },
    {
      "id": "docs",
      "label": "Documents",
      "baseline": 3
    },
    {
      "id": "votes",
      "label": "Votes",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "fees"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "votes"
      ]
    }
  ],
  "sample": [
    {
      "id": "hoa_tracker-sample-1",
      "name": "Sample fees entry",
      "category": "fees",
      "tags": [
        "hoa"
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
      "id": "hoa_tracker-sample-2",
      "name": "Sample rules entry",
      "category": "rules",
      "tags": [
        "hoa"
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
      "id": "hoa_tracker-sample-3",
      "name": "Sample documents entry",
      "category": "docs",
      "tags": [
        "hoa"
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
      "id": "hoa_tracker-sample-4",
      "name": "Sample votes entry",
      "category": "votes",
      "tags": [
        "hoa"
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
