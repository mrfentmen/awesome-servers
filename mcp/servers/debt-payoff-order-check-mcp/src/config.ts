import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-payoff-order-check-mcp",
  "title": "Debt Payoff Order Audit",
  "description": "Audit debt payoff order by balance, rate, minimum, extra coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_payoff_order",
  "entity": "debt payoff order item",
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
      "id": "minimum",
      "label": "Minimum",
      "baseline": 2
    },
    {
      "id": "extra",
      "label": "Extra",
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
        "extra"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_payoff_order-balance-1",
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
      "id": "debt_payoff_order-rate-2",
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
      "id": "debt_payoff_order-minimum-3",
      "name": "Minimum primary",
      "category": "minimum",
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
      "id": "debt_payoff_order-extra-4",
      "name": "Extra primary",
      "category": "extra",
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
      "id": "debt_payoff_order-balance-5",
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
      "id": "debt_payoff_order-rate-6",
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
      "id": "debt_payoff_order-minimum-7",
      "name": "Minimum backup",
      "category": "minimum",
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
      "id": "debt_payoff_order-extra-8",
      "name": "Extra backup",
      "category": "extra",
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
