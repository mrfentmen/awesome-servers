import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "memorial-service-plan-mcp",
  "title": "Memorial Service Plan Audit",
  "description": "Memorial Service Plan Audit: readings music and guestbook plan. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "memorial_plan",
  "entity": "element",
  "categories": [
    {
      "id": "readings",
      "label": "Readings",
      "baseline": 4
    },
    {
      "id": "music",
      "label": "Music",
      "baseline": 3
    },
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 3
    },
    {
      "id": "guestbook",
      "label": "Guestbook",
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
        "readings"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "guestbook"
      ]
    }
  ],
  "sample": [
    {
      "id": "memorial_plan-sample-1",
      "name": "Sample readings entry",
      "category": "readings",
      "tags": [
        "memorial"
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
      "id": "memorial_plan-sample-2",
      "name": "Sample music entry",
      "category": "music",
      "tags": [
        "memorial"
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
      "id": "memorial_plan-sample-3",
      "name": "Sample photos entry",
      "category": "photos",
      "tags": [
        "memorial"
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
      "id": "memorial_plan-sample-4",
      "name": "Sample guestbook entry",
      "category": "guestbook",
      "tags": [
        "memorial"
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
