import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-auto-loan-refinance-check-mcp",
  "title": "Auto Loan Refinance Audit",
  "description": "Audit auto loan refinance by balance, rate, term, value coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_auto_loan_refinance",
  "entity": "auto loan refinance item",
  "categories": [
    {
      "id": "balance",
      "label": "Balance",
      "baseline": 2
    },
    {
      "id": "rate",
      "label": "Rate",
      "baseline": 2
    },
    {
      "id": "term",
      "label": "Term",
      "baseline": 2
    },
    {
      "id": "value",
      "label": "Value",
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
        "value"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_auto_loan_refinance-balance-1",
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
      "id": "debt_auto_loan_refinance-rate-2",
      "name": "Rate primary",
      "category": "rate",
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
      "id": "debt_auto_loan_refinance-term-3",
      "name": "Term primary",
      "category": "term",
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
      "id": "debt_auto_loan_refinance-value-4",
      "name": "Value primary",
      "category": "value",
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
      "id": "debt_auto_loan_refinance-balance-5",
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
      "id": "debt_auto_loan_refinance-rate-6",
      "name": "Rate backup",
      "category": "rate",
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
      "id": "debt_auto_loan_refinance-term-7",
      "name": "Term backup",
      "category": "term",
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
      "id": "debt_auto_loan_refinance-value-8",
      "name": "Value backup",
      "category": "value",
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
