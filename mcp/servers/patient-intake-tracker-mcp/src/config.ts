import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "patient-intake-tracker-mcp",
  "title": "patient intake tracker Tracker",
  "description": "Real local JSON analysis of patient intake tracker in the Health & Care Work lane. 25 MCP tools, no paywall.",
  "prefix": "care_patient_intake_tracker",
  "entity": "patient intake tracker item",
  "categories": [
    {
      "id": "care",
      "label": "care",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "patient-intake",
      "label": "patient-intake",
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
        "care"
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
      "id": "care_patient_intake_tracker-care-1",
      "name": "care primary",
      "category": "care",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-patient-intake-3",
      "name": "patient-intake primary",
      "category": "patient-intake",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-care-5",
      "name": "care backup",
      "category": "care",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-patient-intake-7",
      "name": "patient-intake backup",
      "category": "patient-intake",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
      "id": "care_patient_intake_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "patient",
        "intake"
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
