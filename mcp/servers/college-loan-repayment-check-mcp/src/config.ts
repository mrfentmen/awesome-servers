import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-loan-repayment-check-mcp",
  "title": "Student Loan Repayment Audit",
  "description": "Audit student loan repayment by balance, rate, term, plan coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_loan_repayment",
  "entity": "student loan repayment item",
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
      "id": "plan",
      "label": "Plan",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_loan_repayment-balance-1",
      "name": "Balance primary",
      "category": "balance",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-rate-2",
      "name": "Rate primary",
      "category": "rate",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-term-3",
      "name": "Term primary",
      "category": "term",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-plan-4",
      "name": "Plan primary",
      "category": "plan",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-balance-5",
      "name": "Balance backup",
      "category": "balance",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-rate-6",
      "name": "Rate backup",
      "category": "rate",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-term-7",
      "name": "Term backup",
      "category": "term",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_loan_repayment-plan-8",
      "name": "Plan backup",
      "category": "plan",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
