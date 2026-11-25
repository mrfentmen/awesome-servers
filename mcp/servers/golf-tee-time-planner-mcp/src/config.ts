import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "golf-tee-time-planner-mcp",
  "title": "golf tee time planner Planner",
  "description": "Real local JSON analysis of golf tee time planner in the Fishing Hunting Camping lane. 25 MCP tools, no paywall.",
  "prefix": "outdoors_golf_tee_time_planner",
  "entity": "golf tee time planner item",
  "categories": [
    {
      "id": "outdoors",
      "label": "outdoors",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
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
      "id": "outdoors_golf_tee_time_planner-outdoors-1",
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
      "id": "outdoors_golf_tee_time_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
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
      "id": "outdoors_golf_tee_time_planner-golf-tee-time-3",
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
      "id": "outdoors_golf_tee_time_planner-mcp-4",
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
      "id": "outdoors_golf_tee_time_planner-outdoors-5",
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
      "id": "outdoors_golf_tee_time_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
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
      "id": "outdoors_golf_tee_time_planner-golf-tee-time-7",
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
      "id": "outdoors_golf_tee_time_planner-mcp-8",
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
