import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "bank-reconcile-compare-mcp",
  "title": "bank reconcile compare Compare",
  "description": "Real local JSON analysis of bank reconcile compare in the Money & Books lane. 25 MCP tools, no paywall.",
  "prefix": "money_bank_reconcile_compare",
  "entity": "bank reconcile compare item",
  "categories": [
    {
      "id": "money",
      "label": "money",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "bank-reconcile",
      "label": "bank-reconcile",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
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
        "money"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "money_bank_reconcile_compare-money-1",
      "name": "money primary",
      "category": "money",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-bank-reconcile-3",
      "name": "bank-reconcile primary",
      "category": "bank-reconcile",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-money-5",
      "name": "money backup",
      "category": "money",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-bank-reconcile-7",
      "name": "bank-reconcile backup",
      "category": "bank-reconcile",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
      "id": "money_bank_reconcile_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "money-books",
        "bank",
        "reconcile"
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
