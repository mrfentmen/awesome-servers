import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "shift-schedule-checklist-mcp",
  "title": "shift schedule checklist Checklist",
  "description": "Real local JSON analysis of shift schedule checklist in the Work & Trades lane. 25 MCP tools, no paywall.",
  "prefix": "work_shift_schedule_checklist",
  "entity": "shift schedule checklist item",
  "categories": [
    {
      "id": "work",
      "label": "work",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "shift-schedule",
      "label": "shift-schedule",
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
        "work"
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
      "id": "work_shift_schedule_checklist-work-1",
      "name": "work primary",
      "category": "work",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-shift-schedule-3",
      "name": "shift-schedule primary",
      "category": "shift-schedule",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-work-5",
      "name": "work backup",
      "category": "work",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-shift-schedule-7",
      "name": "shift-schedule backup",
      "category": "shift-schedule",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
      "id": "work_shift_schedule_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "work-trades",
        "shift",
        "schedule"
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
