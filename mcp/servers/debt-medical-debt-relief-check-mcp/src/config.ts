import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-medical-debt-relief-check-mcp",
  "title": "Medical Debt Relief Audit",
  "description": "Audit medical debt relief by bill, charity, payment, appeal coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_medical_debt_relief",
  "entity": "medical debt relief item",
  "categories": [
    {
      "id": "bill",
      "label": "Bill",
      "baseline": 2
    },
    {
      "id": "charity",
      "label": "Charity",
      "baseline": 2
    },
    {
      "id": "payment",
      "label": "Payment",
      "baseline": 2
    },
    {
      "id": "appeal",
      "label": "Appeal",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 30,
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
        "bill"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "appeal"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_medical_debt_relief-bill-1",
      "name": "Bill primary",
      "category": "bill",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-charity-2",
      "name": "Charity primary",
      "category": "charity",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-payment-3",
      "name": "Payment primary",
      "category": "payment",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-appeal-4",
      "name": "Appeal primary",
      "category": "appeal",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-bill-5",
      "name": "Bill backup",
      "category": "bill",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-charity-6",
      "name": "Charity backup",
      "category": "charity",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-payment-7",
      "name": "Payment backup",
      "category": "payment",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_medical_debt_relief-appeal-8",
      "name": "Appeal backup",
      "category": "appeal",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
