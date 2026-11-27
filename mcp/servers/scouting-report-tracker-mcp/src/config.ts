import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "scouting-report-tracker-mcp",
  "title": "scouting report tracker Tracker",
  "description": "Real local JSON analysis of scouting report tracker in the Sports Coaching lane. 25 MCP tools, no paywall.",
  "prefix": "coach_scouting_report_tracker",
  "entity": "scouting report tracker item",
  "categories": [
    {
      "id": "coach",
      "label": "coach",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "scouting-report",
      "label": "scouting-report",
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
        "coach"
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
      "id": "coach_scouting_report_tracker-coach-1",
      "name": "coach primary",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-scouting-report-3",
      "name": "scouting-report primary",
      "category": "scouting-report",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-coach-5",
      "name": "coach backup",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-scouting-report-7",
      "name": "scouting-report backup",
      "category": "scouting-report",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
      "id": "coach_scouting_report_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "scouting",
        "report"
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
