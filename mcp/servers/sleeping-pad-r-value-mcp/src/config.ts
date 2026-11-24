import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sleeping-pad-r-value-mcp",
  "title": "Sleeping Pad R Value Tracker",
  "description": "Real local JSON analysis of sleeping pad r value in the Trail Camp lane. 25 MCP tools, no paywall.",
  "prefix": "trail_camp_sleeping_pad_r_value",
  "entity": "sleeping pad r value item",
  "categories": [
    {
      "id": "models",
      "label": "Models",
      "baseline": 2
    },
    {
      "id": "prices",
      "label": "Prices",
      "baseline": 2
    },
    {
      "id": "stock",
      "label": "Stock",
      "baseline": 2
    },
    {
      "id": "shifts",
      "label": "Shifts",
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
        "models"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shifts"
      ]
    }
  ],
  "sample": [
    {
      "id": "trail_camp_sleeping_pad_r_value-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-stock-3",
      "name": "Stock primary",
      "category": "stock",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-shifts-4",
      "name": "Shifts primary",
      "category": "shifts",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-models-5",
      "name": "Models backup",
      "category": "models",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-prices-6",
      "name": "Prices backup",
      "category": "prices",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-stock-7",
      "name": "Stock backup",
      "category": "stock",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
      "id": "trail_camp_sleeping_pad_r_value-shifts-8",
      "name": "Shifts backup",
      "category": "shifts",
      "tags": [
        "trail-camp",
        "sleeping",
        "pad"
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
