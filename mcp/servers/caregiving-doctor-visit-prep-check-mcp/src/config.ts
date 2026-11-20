import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-doctor-visit-prep-check-mcp",
  "title": "Doctor Visit Prep Audit",
  "description": "Audit doctor visit prep by questions, medication list, symptoms, test results coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_doctor_visit_prep",
  "entity": "doctor visit prep item",
  "categories": [
    {
      "id": "questions",
      "label": "Questions",
      "baseline": 2
    },
    {
      "id": "medication-list",
      "label": "Medication list",
      "baseline": 2
    },
    {
      "id": "symptoms",
      "label": "Symptoms",
      "baseline": 2
    },
    {
      "id": "test-results",
      "label": "Test results",
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
        "questions"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "test-results"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_doctor_visit_prep-questions-1",
      "name": "Questions primary",
      "category": "questions",
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
      "id": "caregiving_doctor_visit_prep-medication-list-2",
      "name": "Medication list primary",
      "category": "medication-list",
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
      "id": "caregiving_doctor_visit_prep-symptoms-3",
      "name": "Symptoms primary",
      "category": "symptoms",
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
      "id": "caregiving_doctor_visit_prep-test-results-4",
      "name": "Test results primary",
      "category": "test-results",
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
      "id": "caregiving_doctor_visit_prep-questions-5",
      "name": "Questions backup",
      "category": "questions",
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
      "id": "caregiving_doctor_visit_prep-medication-list-6",
      "name": "Medication list backup",
      "category": "medication-list",
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
      "id": "caregiving_doctor_visit_prep-symptoms-7",
      "name": "Symptoms backup",
      "category": "symptoms",
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
      "id": "caregiving_doctor_visit_prep-test-results-8",
      "name": "Test results backup",
      "category": "test-results",
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
