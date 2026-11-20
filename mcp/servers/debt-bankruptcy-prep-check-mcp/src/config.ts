import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-bankruptcy-prep-check-mcp",
  "title": "Bankruptcy Prep Audit",
  "description": "Audit bankruptcy prep by assets, debts, income, counsel coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_bankruptcy_prep",
  "entity": "bankruptcy prep item",
  "categories": [
    {
      "id": "assets",
      "label": "Assets",
      "baseline": 2
    },
    {
      "id": "debts",
      "label": "Debts",
      "baseline": 2
    },
    {
      "id": "income",
      "label": "Income",
      "baseline": 2
    },
    {
      "id": "counsel",
      "label": "Counsel",
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
        "assets"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "counsel"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_bankruptcy_prep-assets-1",
      "name": "Assets primary",
      "category": "assets",
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
      "id": "debt_bankruptcy_prep-debts-2",
      "name": "Debts primary",
      "category": "debts",
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
      "id": "debt_bankruptcy_prep-income-3",
      "name": "Income primary",
      "category": "income",
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
      "id": "debt_bankruptcy_prep-counsel-4",
      "name": "Counsel primary",
      "category": "counsel",
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
      "id": "debt_bankruptcy_prep-assets-5",
      "name": "Assets backup",
      "category": "assets",
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
      "id": "debt_bankruptcy_prep-debts-6",
      "name": "Debts backup",
      "category": "debts",
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
      "id": "debt_bankruptcy_prep-income-7",
      "name": "Income backup",
      "category": "income",
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
      "id": "debt_bankruptcy_prep-counsel-8",
      "name": "Counsel backup",
      "category": "counsel",
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
