import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "road-trip-compare-mcp",
  "title": "road trip compare Compare",
  "description": "Real local JSON analysis of road trip compare in the Travel & Hospitality lane. 25 MCP tools, no paywall.",
  "prefix": "travel_road_trip_compare",
  "entity": "road trip compare item",
  "categories": [
    {
      "id": "travel",
      "label": "travel",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "road-trip",
      "label": "road-trip",
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
      "id": "travel_road_trip_compare-travel-1",
      "name": "travel primary",
      "category": "travel",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-road-trip-3",
      "name": "road-trip primary",
      "category": "road-trip",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-travel-5",
      "name": "travel backup",
      "category": "travel",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-road-trip-7",
      "name": "road-trip backup",
      "category": "road-trip",
      "tags": [
        "travel-hospitality",
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
      "id": "travel_road_trip_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
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
