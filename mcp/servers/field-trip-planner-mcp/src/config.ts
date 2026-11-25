import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "field-trip-planner-mcp",
  "title": "field trip planner Planner",
  "description": "Real local JSON analysis of field trip planner in the K-12 Schools lane. 25 MCP tools, no paywall.",
  "prefix": "k12_field_trip_planner",
  "entity": "field trip planner item",
  "categories": [
    {
      "id": "k12",
      "label": "k12",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "field-trip",
      "label": "field-trip",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "k12"
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
      "id": "k12_field_trip_planner-k12-1",
      "name": "k12 primary",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-field-trip-3",
      "name": "field-trip primary",
      "category": "field-trip",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-k12-5",
      "name": "k12 backup",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-field-trip-7",
      "name": "field-trip backup",
      "category": "field-trip",
      "tags": [
        "k-12-schools",
        "field",
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
      "id": "k12_field_trip_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "field",
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
