import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "house-cleaning-tracker-mcp",
  "title": "house-cleaning tracker Tracker",
  "description": "Real local JSON analysis of house-cleaning tracker in the Home Services & Moving lane. 25 MCP tools, no paywall.",
  "prefix": "homeservices_house_cleaning_tracker",
  "entity": "house-cleaning tracker item",
  "categories": [
    {
      "id": "homeservices",
      "label": "homeservices",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "house-cleaning",
      "label": "house-cleaning",
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
        "homeservices"
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
      "id": "homeservices_house_cleaning_tracker-homeservices-1",
      "name": "homeservices primary",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-house-cleaning-3",
      "name": "house-cleaning primary",
      "category": "house-cleaning",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-homeservices-5",
      "name": "homeservices backup",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-house-cleaning-7",
      "name": "house-cleaning backup",
      "category": "house-cleaning",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
