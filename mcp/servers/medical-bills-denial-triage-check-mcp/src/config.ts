import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "medical-bills-denial-triage-check-mcp",
  "title": "Denial Triage Audit",
  "description": "Audit denial triage by reason, deadline, records, next step coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "medical_bills_denial_triage",
  "entity": "denial triage item",
  "categories": [
    {
      "id": "reason",
      "label": "Reason",
      "baseline": 2
    },
    {
      "id": "deadline",
      "label": "Deadline",
      "baseline": 2
    },
    {
      "id": "records",
      "label": "Records",
      "baseline": 2
    },
    {
      "id": "next-step",
      "label": "Next step",
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
        "reason"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "next-step"
      ]
    }
  ],
  "sample": [
    {
      "id": "medical_bills_denial_triage-reason-1",
      "name": "Reason primary",
      "category": "reason",
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
      "id": "medical_bills_denial_triage-deadline-2",
      "name": "Deadline primary",
      "category": "deadline",
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
      "id": "medical_bills_denial_triage-records-3",
      "name": "Records primary",
      "category": "records",
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
      "id": "medical_bills_denial_triage-next-step-4",
      "name": "Next step primary",
      "category": "next-step",
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
      "id": "medical_bills_denial_triage-reason-5",
      "name": "Reason backup",
      "category": "reason",
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
      "id": "medical_bills_denial_triage-deadline-6",
      "name": "Deadline backup",
      "category": "deadline",
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
      "id": "medical_bills_denial_triage-records-7",
      "name": "Records backup",
      "category": "records",
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
      "id": "medical_bills_denial_triage-next-step-8",
      "name": "Next step backup",
      "category": "next-step",
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
