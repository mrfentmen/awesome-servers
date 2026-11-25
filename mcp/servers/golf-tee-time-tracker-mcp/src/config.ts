import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "golf-tee-time-tracker-mcp",
  "title": "golf tee time tracker Tracker",
  "description": "Real local JSON analysis of golf tee time tracker in the Fishing Hunting Camping lane. 25 MCP tools, no paywall.",
  "prefix": "outdoors_golf_tee_time_tracker",
  "entity": "golf tee time tracker item",
  "categories": [
    {
      "id": "outdoors",
      "label": "outdoors",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "golf-tee-time",
      "label": "golf-tee-time",
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
        "outdoors"
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
      "id": "outdoors_golf_tee_time_tracker-outdoors-1",
      "name": "outdoors primary",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-golf-tee-time-3",
      "name": "golf-tee-time primary",
      "category": "golf-tee-time",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-outdoors-5",
      "name": "outdoors backup",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-golf-tee-time-7",
      "name": "golf-tee-time backup",
      "category": "golf-tee-time",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
      "id": "outdoors_golf_tee_time_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "golf",
        "tee"
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
