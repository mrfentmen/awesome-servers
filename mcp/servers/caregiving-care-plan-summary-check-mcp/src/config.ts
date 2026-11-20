import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-care-plan-summary-check-mcp",
  "title": "Care Plan Summary Audit",
  "description": "Audit care plan summary by diagnosis, medications, daily needs, emergency contacts coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_care_plan_summary",
  "entity": "care plan summary item",
  "categories": [
    {
      "id": "diagnosis",
      "label": "Diagnosis",
      "baseline": 2
    },
    {
      "id": "medications",
      "label": "Medications",
      "baseline": 2
    },
    {
      "id": "daily-needs",
      "label": "Daily needs",
      "baseline": 2
    },
    {
      "id": "emergency-contacts",
      "label": "Emergency contacts",
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
        "diagnosis"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "emergency-contacts"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_care_plan_summary-diagnosis-1",
      "name": "Diagnosis primary",
      "category": "diagnosis",
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
      "id": "caregiving_care_plan_summary-medications-2",
      "name": "Medications primary",
      "category": "medications",
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
      "id": "caregiving_care_plan_summary-daily-needs-3",
      "name": "Daily needs primary",
      "category": "daily-needs",
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
      "id": "caregiving_care_plan_summary-emergency-contacts-4",
      "name": "Emergency contacts primary",
      "category": "emergency-contacts",
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
      "id": "caregiving_care_plan_summary-diagnosis-5",
      "name": "Diagnosis backup",
      "category": "diagnosis",
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
      "id": "caregiving_care_plan_summary-medications-6",
      "name": "Medications backup",
      "category": "medications",
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
      "id": "caregiving_care_plan_summary-daily-needs-7",
      "name": "Daily needs backup",
      "category": "daily-needs",
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
      "id": "caregiving_care_plan_summary-emergency-contacts-8",
      "name": "Emergency contacts backup",
      "category": "emergency-contacts",
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
