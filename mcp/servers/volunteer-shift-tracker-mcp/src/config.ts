import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "volunteer-shift-tracker-mcp",
  "title": "volunteer shift tracker Tracker",
  "description": "Real local JSON analysis of volunteer shift tracker in the Nonprofits & Community lane. 25 MCP tools, no paywall.",
  "prefix": "nonprofit_volunteer_shift_tracker",
  "entity": "volunteer shift tracker item",
  "categories": [
    {
      "id": "nonprofit",
      "label": "nonprofit",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "volunteer-shift",
      "label": "volunteer-shift",
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
        "nonprofit"
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
      "id": "nonprofit_volunteer_shift_tracker-nonprofit-1",
      "name": "nonprofit primary",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-volunteer-shift-3",
      "name": "volunteer-shift primary",
      "category": "volunteer-shift",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-nonprofit-5",
      "name": "nonprofit backup",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-volunteer-shift-7",
      "name": "volunteer-shift backup",
      "category": "volunteer-shift",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
      "id": "nonprofit_volunteer_shift_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "volunteer",
        "shift"
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
