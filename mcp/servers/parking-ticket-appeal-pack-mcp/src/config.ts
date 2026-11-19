import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "parking-ticket-appeal-pack-mcp",
  "title": "Parking Ticket Appeal Pack Audit",
  "description": "Parking Ticket Appeal Pack Audit: appeal evidence pack builder. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ticket_appeal",
  "entity": "ticket",
  "categories": [
    {
      "id": "meter",
      "label": "Meter",
      "baseline": 4
    },
    {
      "id": "street",
      "label": "Street",
      "baseline": 3
    },
    {
      "id": "lot",
      "label": "Lots",
      "baseline": 3
    },
    {
      "id": "camera",
      "label": "Camera",
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
        "meter"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "camera"
      ]
    }
  ],
  "sample": [
    {
      "id": "ticket_appeal-sample-1",
      "name": "Sample meter entry",
      "category": "meter",
      "tags": [
        "parking"
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
      "id": "ticket_appeal-sample-2",
      "name": "Sample street entry",
      "category": "street",
      "tags": [
        "parking"
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
      "id": "ticket_appeal-sample-3",
      "name": "Sample lots entry",
      "category": "lot",
      "tags": [
        "parking"
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
      "id": "ticket_appeal-sample-4",
      "name": "Sample camera entry",
      "category": "camera",
      "tags": [
        "parking"
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
