import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "stadium-airport-food-finder-mcp",
  "title": "Stadium Airport Food Finder Audit",
  "description": "Stadium Airport Food Finder Audit: venue food map and prices. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "venue_food",
  "entity": "stand",
  "categories": [
    {
      "id": "stadium",
      "label": "Stadiums",
      "baseline": 4
    },
    {
      "id": "airport",
      "label": "Airports",
      "baseline": 3
    },
    {
      "id": "arena",
      "label": "Arenas",
      "baseline": 3
    },
    {
      "id": "fair",
      "label": "Fairs",
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
        "stadium"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "fair"
      ]
    }
  ],
  "sample": [
    {
      "id": "venue_food-sample-1",
      "name": "Sample stadiums entry",
      "category": "stadium",
      "tags": [
        "stadium"
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
      "id": "venue_food-sample-2",
      "name": "Sample airports entry",
      "category": "airport",
      "tags": [
        "stadium"
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
      "id": "venue_food-sample-3",
      "name": "Sample arenas entry",
      "category": "arena",
      "tags": [
        "stadium"
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
      "id": "venue_food-sample-4",
      "name": "Sample fairs entry",
      "category": "fair",
      "tags": [
        "stadium"
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
