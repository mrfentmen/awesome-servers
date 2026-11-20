import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-caregiver-task-calendar-check-mcp",
  "title": "Caregiver Task Calendar Audit",
  "description": "Audit caregiver task calendar by daily tasks, weekly tasks, appointments, backup coverage coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_caregiver_task_calendar",
  "entity": "caregiver task calendar item",
  "categories": [
    {
      "id": "daily-tasks",
      "label": "Daily tasks",
      "baseline": 2
    },
    {
      "id": "weekly-tasks",
      "label": "Weekly tasks",
      "baseline": 2
    },
    {
      "id": "appointments",
      "label": "Appointments",
      "baseline": 2
    },
    {
      "id": "backup-coverage",
      "label": "Backup coverage",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
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
        "daily-tasks"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "backup-coverage"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_caregiver_task_calendar-daily-tasks-1",
      "name": "Daily tasks primary",
      "category": "daily-tasks",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-weekly-tasks-2",
      "name": "Weekly tasks primary",
      "category": "weekly-tasks",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-appointments-3",
      "name": "Appointments primary",
      "category": "appointments",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-backup-coverage-4",
      "name": "Backup coverage primary",
      "category": "backup-coverage",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-daily-tasks-5",
      "name": "Daily tasks backup",
      "category": "daily-tasks",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-weekly-tasks-6",
      "name": "Weekly tasks backup",
      "category": "weekly-tasks",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-appointments-7",
      "name": "Appointments backup",
      "category": "appointments",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_caregiver_task_calendar-backup-coverage-8",
      "name": "Backup coverage backup",
      "category": "backup-coverage",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
