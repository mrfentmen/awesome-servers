import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "medical-bills-medical-debt-negotiation-check-mcp",
  "title": "Medical Debt Negotiation Audit",
  "description": "Audit medical debt negotiation by balance, offer, agreement, payment coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "medical_bills_medical_debt_negotiation",
  "entity": "medical debt negotiation item",
  "categories": [
    {
      "id": "balance",
      "label": "Balance",
      "baseline": 2
    },
    {
      "id": "offer",
      "label": "Offer",
      "baseline": 2
    },
    {
      "id": "agreement",
      "label": "Agreement",
      "baseline": 2
    },
    {
      "id": "payment",
      "label": "Payment",
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
        "balance"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "payment"
      ]
    }
  ],
  "sample": [
    {
      "id": "medical_bills_medical_debt_negotiation-balance-1",
      "name": "Balance primary",
      "category": "balance",
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
      "id": "medical_bills_medical_debt_negotiation-offer-2",
      "name": "Offer primary",
      "category": "offer",
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
      "id": "medical_bills_medical_debt_negotiation-agreement-3",
      "name": "Agreement primary",
      "category": "agreement",
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
      "id": "medical_bills_medical_debt_negotiation-payment-4",
      "name": "Payment primary",
      "category": "payment",
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
      "id": "medical_bills_medical_debt_negotiation-balance-5",
      "name": "Balance backup",
      "category": "balance",
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
      "id": "medical_bills_medical_debt_negotiation-offer-6",
      "name": "Offer backup",
      "category": "offer",
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
      "id": "medical_bills_medical_debt_negotiation-agreement-7",
      "name": "Agreement backup",
      "category": "agreement",
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
      "id": "medical_bills_medical_debt_negotiation-payment-8",
      "name": "Payment backup",
      "category": "payment",
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
