import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "budget-variance-guide-mcp",
  "title": "budget variance guide Guide",
  "description": "Real local JSON analysis of budget variance guide in the Money & Books lane. 25 MCP tools, no paywall.",
  "prefix": "money_budget_variance_guide",
  "entity": "budget variance guide item",
  "categories": [
    {
      "id": "money",
      "label": "money",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "budget-variance",
      "label": "budget-variance",
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
      "id": "money_budget_variance_guide-money-1",
      "name": "money primary",
      "category": "money",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-budget-variance-3",
      "name": "budget-variance primary",
      "category": "budget-variance",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-money-5",
      "name": "money backup",
      "category": "money",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-budget-variance-7",
      "name": "budget-variance backup",
      "category": "budget-variance",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
      "id": "money_budget_variance_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "money-books",
        "budget",
        "variance"
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
