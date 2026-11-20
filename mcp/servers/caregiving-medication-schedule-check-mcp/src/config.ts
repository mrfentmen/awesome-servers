import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-medication-schedule-check-mcp",
  "title": "Medication Schedule Audit",
  "description": "Audit medication schedule by morning doses, midday doses, evening doses, refill plan coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_medication_schedule",
  "entity": "medication schedule item",
  "categories": [
    {
      "id": "morning-doses",
      "label": "Morning doses",
      "baseline": 2
    },
    {
      "id": "midday-doses",
      "label": "Midday doses",
      "baseline": 2
    },
    {
      "id": "evening-doses",
      "label": "Evening doses",
      "baseline": 2
    },
    {
      "id": "refill-plan",
      "label": "Refill plan",
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
        "morning-doses"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "refill-plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_medication_schedule-morning-doses-1",
      "name": "Morning doses primary",
      "category": "morning-doses",
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
      "id": "caregiving_medication_schedule-midday-doses-2",
      "name": "Midday doses primary",
      "category": "midday-doses",
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
      "id": "caregiving_medication_schedule-evening-doses-3",
      "name": "Evening doses primary",
      "category": "evening-doses",
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
      "id": "caregiving_medication_schedule-refill-plan-4",
      "name": "Refill plan primary",
      "category": "refill-plan",
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
      "id": "caregiving_medication_schedule-morning-doses-5",
      "name": "Morning doses backup",
      "category": "morning-doses",
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
      "id": "caregiving_medication_schedule-midday-doses-6",
      "name": "Midday doses backup",
      "category": "midday-doses",
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
      "id": "caregiving_medication_schedule-evening-doses-7",
      "name": "Evening doses backup",
      "category": "evening-doses",
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
      "id": "caregiving_medication_schedule-refill-plan-8",
      "name": "Refill plan backup",
      "category": "refill-plan",
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
