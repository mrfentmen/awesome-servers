import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "graduations-gift-thanks-track-index-mcp",
  "title": "Gift Thanks Track Archive",
  "description": "Real local JSON analysis of gift thanks track in the Graduations lane. 25 MCP tools, no paywall.",
  "prefix": "graduations_graduations_gift_thanks_track_index",
  "entity": "gift thanks track item",
  "categories": [
    {
      "id": "records",
      "label": "Records",
      "baseline": 2
    },
    {
      "id": "tags",
      "label": "Tags",
      "baseline": 2
    },
    {
      "id": "history",
      "label": "History",
      "baseline": 2
    },
    {
      "id": "exports",
      "label": "Exports",
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
        "records"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "exports"
      ]
    }
  ],
  "sample": [
    {
      "id": "graduations_graduations_gift_thanks_track_index-records-1",
      "name": "Records primary",
      "category": "records",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-tags-2",
      "name": "Tags primary",
      "category": "tags",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-history-3",
      "name": "History primary",
      "category": "history",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-exports-4",
      "name": "Exports primary",
      "category": "exports",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-records-5",
      "name": "Records backup",
      "category": "records",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-tags-6",
      "name": "Tags backup",
      "category": "tags",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-history-7",
      "name": "History backup",
      "category": "history",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
      "id": "graduations_graduations_gift_thanks_track_index-exports-8",
      "name": "Exports backup",
      "category": "exports",
      "tags": [
        "graduations",
        "graduations",
        "gift"
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
