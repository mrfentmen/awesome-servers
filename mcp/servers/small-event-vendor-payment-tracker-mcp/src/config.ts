import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-event-vendor-payment-tracker-mcp",
  "title": "Small Event Vendor Payment Tracker Audit",
  "description": "Small Event Vendor Payment Tracker Audit: track small event deposits and balances. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "event_vendor",
  "entity": "vendor",
  "categories": [
    {
      "id": "venue",
      "label": "Venue",
      "baseline": 4
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 3
    },
    {
      "id": "music",
      "label": "Music",
      "baseline": 3
    },
    {
      "id": "decor",
      "label": "Decor",
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
        "venue"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "decor"
      ]
    }
  ],
  "sample": [
    {
      "id": "event_vendor-sample-1",
      "name": "Sample venue entry",
      "category": "venue",
      "tags": [
        "event"
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
      "id": "event_vendor-sample-2",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "event"
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
      "id": "event_vendor-sample-3",
      "name": "Sample music entry",
      "category": "music",
      "tags": [
        "event"
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
      "id": "event_vendor-sample-4",
      "name": "Sample decor entry",
      "category": "decor",
      "tags": [
        "event"
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
