import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "teen-driver-practice-log-mcp",
  "title": "Teen Driver Practice Log Audit",
  "description": "Teen Driver Practice Log Audit: practice hours and skills log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "teen_drive",
  "entity": "session",
  "categories": [
    {
      "id": "day",
      "label": "Day",
      "baseline": 4
    },
    {
      "id": "night",
      "label": "Night",
      "baseline": 3
    },
    {
      "id": "highway",
      "label": "Highway",
      "baseline": 3
    },
    {
      "id": "parking",
      "label": "Parking",
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
        "day"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "parking"
      ]
    }
  ],
  "sample": [
    {
      "id": "teen_drive-sample-1",
      "name": "Sample day entry",
      "category": "day",
      "tags": [
        "teen"
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
      "id": "teen_drive-sample-2",
      "name": "Sample night entry",
      "category": "night",
      "tags": [
        "teen"
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
      "id": "teen_drive-sample-3",
      "name": "Sample highway entry",
      "category": "highway",
      "tags": [
        "teen"
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
      "id": "teen_drive-sample-4",
      "name": "Sample parking entry",
      "category": "parking",
      "tags": [
        "teen"
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
