import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "medical-bills-hsa-fsa-check-check-mcp",
  "title": "HSA and FSA Check Audit",
  "description": "Audit hsa and fsa check by eligibility, receipts, contribution, deadline coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "medical_bills_hsa_fsa_check",
  "entity": "hsa and fsa check item",
  "categories": [
    {
      "id": "eligibility",
      "label": "Eligibility",
      "baseline": 2
    },
    {
      "id": "receipts",
      "label": "Receipts",
      "baseline": 2
    },
    {
      "id": "contribution",
      "label": "Contribution",
      "baseline": 2
    },
    {
      "id": "deadline",
      "label": "Deadline",
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
        "eligibility"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadline"
      ]
    }
  ],
  "sample": [
    {
      "id": "medical_bills_hsa_fsa_check-eligibility-1",
      "name": "Eligibility primary",
      "category": "eligibility",
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
      "id": "medical_bills_hsa_fsa_check-receipts-2",
      "name": "Receipts primary",
      "category": "receipts",
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
      "id": "medical_bills_hsa_fsa_check-contribution-3",
      "name": "Contribution primary",
      "category": "contribution",
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
      "id": "medical_bills_hsa_fsa_check-deadline-4",
      "name": "Deadline primary",
      "category": "deadline",
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
      "id": "medical_bills_hsa_fsa_check-eligibility-5",
      "name": "Eligibility backup",
      "category": "eligibility",
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
      "id": "medical_bills_hsa_fsa_check-receipts-6",
      "name": "Receipts backup",
      "category": "receipts",
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
      "id": "medical_bills_hsa_fsa_check-contribution-7",
      "name": "Contribution backup",
      "category": "contribution",
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
      "id": "medical_bills_hsa_fsa_check-deadline-8",
      "name": "Deadline backup",
      "category": "deadline",
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
