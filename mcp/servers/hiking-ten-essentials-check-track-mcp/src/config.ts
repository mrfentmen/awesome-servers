import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "hiking-ten-essentials-check-track-mcp",
  "title": "Ten Essentials Check Tracker",
  "description": "Real local JSON analysis of ten essentials check in the Hiking lane. 25 MCP tools, no paywall.",
  "prefix": "hiking_hiking_ten_essentials_check_track",
  "entity": "ten essentials check item",
  "categories": [
    {
      "id": "entries",
      "label": "Entries",
      "baseline": 2
    },
    {
      "id": "streaks",
      "label": "Streaks",
      "baseline": 2
    },
    {
      "id": "reminders",
      "label": "Reminders",
      "baseline": 2
    },
    {
      "id": "milestones",
      "label": "Milestones",
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
        "entries"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "milestones"
      ]
    }
  ],
  "sample": [
    {
      "id": "hiking_hiking_ten_essentials_check_track-entries-1",
      "name": "Entries primary",
      "category": "entries",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-streaks-2",
      "name": "Streaks primary",
      "category": "streaks",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-reminders-3",
      "name": "Reminders primary",
      "category": "reminders",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-milestones-4",
      "name": "Milestones primary",
      "category": "milestones",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-entries-5",
      "name": "Entries backup",
      "category": "entries",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-streaks-6",
      "name": "Streaks backup",
      "category": "streaks",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-reminders-7",
      "name": "Reminders backup",
      "category": "reminders",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
      "id": "hiking_hiking_ten_essentials_check_track-milestones-8",
      "name": "Milestones backup",
      "category": "milestones",
      "tags": [
        "hiking",
        "hiking",
        "ten"
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
