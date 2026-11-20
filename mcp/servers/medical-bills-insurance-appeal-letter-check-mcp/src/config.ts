import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "medical-bills-insurance-appeal-letter-check-mcp",
  "title": "Insurance Appeal Letter Audit",
  "description": "Audit insurance appeal letter by denial, evidence, deadline, delivery coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "medical_bills_insurance_appeal_letter",
  "entity": "insurance appeal letter item",
  "categories": [
    {
      "id": "denial",
      "label": "Denial",
      "baseline": 2
    },
    {
      "id": "evidence",
      "label": "Evidence",
      "baseline": 2
    },
    {
      "id": "deadline",
      "label": "Deadline",
      "baseline": 2
    },
    {
      "id": "delivery",
      "label": "Delivery",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "clearance_risk",
    "label": "Claim risk",
    "unit": "score",
    "target": 0,
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
        "denial"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "delivery"
      ]
    }
  ],
  "sample": [
    {
      "id": "medical_bills_insurance_appeal_letter-denial-1",
      "name": "Denial primary",
      "category": "denial",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_insurance_appeal_letter-evidence-2",
      "name": "Evidence primary",
      "category": "evidence",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "pending"
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
      "id": "medical_bills_insurance_appeal_letter-deadline-3",
      "name": "Deadline primary",
      "category": "deadline",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "denied"
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
      "id": "medical_bills_insurance_appeal_letter-delivery-4",
      "name": "Delivery primary",
      "category": "delivery",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_insurance_appeal_letter-denial-5",
      "name": "Denial backup",
      "category": "denial",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_insurance_appeal_letter-evidence-6",
      "name": "Evidence backup",
      "category": "evidence",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "pending"
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
      "id": "medical_bills_insurance_appeal_letter-deadline-7",
      "name": "Deadline backup",
      "category": "deadline",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "denied"
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
      "id": "medical_bills_insurance_appeal_letter-delivery-8",
      "name": "Delivery backup",
      "category": "delivery",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
