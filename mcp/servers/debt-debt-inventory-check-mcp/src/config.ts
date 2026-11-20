import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-debt-inventory-check-mcp",
  "title": "Debt Inventory Audit",
  "description": "Audit debt inventory by creditor, balance, rate, due date coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_debt_inventory",
  "entity": "debt inventory item",
  "categories": [
    {
      "id": "creditor",
      "label": "Creditor",
      "baseline": 2
    },
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
      "id": "due-date",
      "label": "Due date",
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
        "creditor"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "due-date"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_debt_inventory-creditor-1",
      "name": "Creditor primary",
      "category": "creditor",
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
      "id": "debt_debt_inventory-balance-2",
      "name": "Balance primary",
      "category": "balance",
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
      "id": "debt_debt_inventory-rate-3",
      "name": "Rate primary",
      "category": "rate",
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
      "id": "debt_debt_inventory-due-date-4",
      "name": "Due date primary",
      "category": "due-date",
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
      "id": "debt_debt_inventory-creditor-5",
      "name": "Creditor backup",
      "category": "creditor",
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
      "id": "debt_debt_inventory-balance-6",
      "name": "Balance backup",
      "category": "balance",
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
      "id": "debt_debt_inventory-rate-7",
      "name": "Rate backup",
      "category": "rate",
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
      "id": "debt_debt_inventory-due-date-8",
      "name": "Due date backup",
      "category": "due-date",
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
