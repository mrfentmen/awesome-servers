import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "road-trip-snack-pack-mcp",
  "title": "Road Trip Snack Pack Guide",
  "description": "Real local JSON analysis of road trip snack pack in the Trip Ready lane. 25 MCP tools, no paywall.",
  "prefix": "trip_ready_road_trip_snack_pack",
  "entity": "road trip snack pack item",
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
      "id": "trip_ready_road_trip_snack_pack-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-stock-3",
      "name": "Stock primary",
      "category": "stock",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-shifts-4",
      "name": "Shifts primary",
      "category": "shifts",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-models-5",
      "name": "Models backup",
      "category": "models",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-prices-6",
      "name": "Prices backup",
      "category": "prices",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-stock-7",
      "name": "Stock backup",
      "category": "stock",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
      "id": "trip_ready_road_trip_snack_pack-shifts-8",
      "name": "Shifts backup",
      "category": "shifts",
      "tags": [
        "trip-ready",
        "road",
        "trip"
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
