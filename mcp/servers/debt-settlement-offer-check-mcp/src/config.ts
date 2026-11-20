import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-settlement-offer-check-mcp",
  "title": "Debt Settlement Offer Audit",
  "description": "Audit debt settlement offer by balance, offer, letter, payment coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_settlement_offer",
  "entity": "debt settlement offer item",
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
      "id": "letter",
      "label": "Letter",
      "baseline": 2
    },
    {
      "id": "payment",
      "label": "Payment",
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
      "id": "debt_settlement_offer-balance-1",
      "name": "Balance primary",
      "category": "balance",
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
      "id": "debt_settlement_offer-offer-2",
      "name": "Offer primary",
      "category": "offer",
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
      "id": "debt_settlement_offer-letter-3",
      "name": "Letter primary",
      "category": "letter",
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
      "id": "debt_settlement_offer-payment-4",
      "name": "Payment primary",
      "category": "payment",
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
      "id": "debt_settlement_offer-balance-5",
      "name": "Balance backup",
      "category": "balance",
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
      "id": "debt_settlement_offer-offer-6",
      "name": "Offer backup",
      "category": "offer",
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
      "id": "debt_settlement_offer-letter-7",
      "name": "Letter backup",
      "category": "letter",
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
      "id": "debt_settlement_offer-payment-8",
      "name": "Payment backup",
      "category": "payment",
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
