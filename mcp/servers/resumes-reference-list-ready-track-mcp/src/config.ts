import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "resumes-reference-list-ready-track-mcp",
  "title": "Reference List Ready Tracker",
  "description": "Real local JSON analysis of reference list ready in the Resumes lane. 25 MCP tools, no paywall.",
  "prefix": "resumes_resumes_reference_list_ready_track",
  "entity": "reference list ready item",
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
      "id": "resumes_resumes_reference_list_ready_track-entries-1",
      "name": "Entries primary",
      "category": "entries",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-streaks-2",
      "name": "Streaks primary",
      "category": "streaks",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-reminders-3",
      "name": "Reminders primary",
      "category": "reminders",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-milestones-4",
      "name": "Milestones primary",
      "category": "milestones",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-entries-5",
      "name": "Entries backup",
      "category": "entries",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-streaks-6",
      "name": "Streaks backup",
      "category": "streaks",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-reminders-7",
      "name": "Reminders backup",
      "category": "reminders",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
      "id": "resumes_resumes_reference_list_ready_track-milestones-8",
      "name": "Milestones backup",
      "category": "milestones",
      "tags": [
        "resumes",
        "resumes",
        "reference"
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
