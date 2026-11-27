import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "meter-read-tracker-mcp",
  "title": "meter read tracker Tracker",
  "description": "Real local JSON analysis of meter read tracker in the Water & Waste lane. 25 MCP tools, no paywall.",
  "prefix": "util_meter_read_tracker",
  "entity": "meter read tracker item",
  "categories": [
    {
      "id": "util",
      "label": "util",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "meter-read",
      "label": "meter-read",
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
        "util"
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
      "id": "util_meter_read_tracker-util-1",
      "name": "util primary",
      "category": "util",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-meter-read-3",
      "name": "meter-read primary",
      "category": "meter-read",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-util-5",
      "name": "util backup",
      "category": "util",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-meter-read-7",
      "name": "meter-read backup",
      "category": "meter-read",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
      "id": "util_meter_read_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "water-waste",
        "meter",
        "read"
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
