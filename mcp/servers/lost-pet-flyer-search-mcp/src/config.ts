import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lost-pet-flyer-search-mcp",
  "title": "Lost Pet Flyer Search Audit",
  "description": "Lost Pet Flyer Search Audit: flyer and search log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lost_pet",
  "entity": "flyer",
  "categories": [
    {
      "id": "dogs",
      "label": "Dogs",
      "baseline": 4
    },
    {
      "id": "cats",
      "label": "Cats",
      "baseline": 3
    },
    {
      "id": "birds",
      "label": "Birds",
      "baseline": 3
    },
    {
      "id": "other",
      "label": "Other",
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
        "dogs"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "other"
      ]
    }
  ],
  "sample": [
    {
      "id": "lost_pet-sample-1",
      "name": "Sample dogs entry",
      "category": "dogs",
      "tags": [
        "lost-pet"
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
      "id": "lost_pet-sample-2",
      "name": "Sample cats entry",
      "category": "cats",
      "tags": [
        "lost-pet"
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
      "id": "lost_pet-sample-3",
      "name": "Sample birds entry",
      "category": "birds",
      "tags": [
        "lost-pet"
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
      "id": "lost_pet-sample-4",
      "name": "Sample other entry",
      "category": "other",
      "tags": [
        "lost-pet"
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
