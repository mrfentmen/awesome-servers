import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "passport-visa-tracker-mcp",
  "title": "passport visa tracker Tracker",
  "description": "Real local JSON analysis of passport visa tracker in the Travel & Hospitality lane. 25 MCP tools, no paywall.",
  "prefix": "travel_passport_visa_tracker",
  "entity": "passport visa tracker item",
  "categories": [
    {
      "id": "travel",
      "label": "travel",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "passport-visa",
      "label": "passport-visa",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "travel"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "travel_passport_visa_tracker-travel-1",
      "name": "travel primary",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-passport-visa-3",
      "name": "passport-visa primary",
      "category": "passport-visa",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-travel-5",
      "name": "travel backup",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-passport-visa-7",
      "name": "passport-visa backup",
      "category": "passport-visa",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
      "id": "travel_passport_visa_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "passport",
        "visa"
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
