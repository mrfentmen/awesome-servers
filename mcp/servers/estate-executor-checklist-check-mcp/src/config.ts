import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-executor-checklist-check-mcp",
  "title": "Executor Checklist Audit",
  "description": "Audit executor checklist by documents, accounts, taxes, notifications coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_executor_checklist",
  "entity": "executor checklist item",
  "categories": [
    {
      "id": "documents",
      "label": "Documents",
      "baseline": 2
    },
    {
      "id": "accounts",
      "label": "Accounts",
      "baseline": 2
    },
    {
      "id": "taxes",
      "label": "Taxes",
      "baseline": 2
    },
    {
      "id": "notifications",
      "label": "Notifications",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 90,
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
        "documents"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "notifications"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_executor_checklist-documents-1",
      "name": "Documents primary",
      "category": "documents",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-accounts-2",
      "name": "Accounts primary",
      "category": "accounts",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-taxes-3",
      "name": "Taxes primary",
      "category": "taxes",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-notifications-4",
      "name": "Notifications primary",
      "category": "notifications",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-documents-5",
      "name": "Documents backup",
      "category": "documents",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-accounts-6",
      "name": "Accounts backup",
      "category": "accounts",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-taxes-7",
      "name": "Taxes backup",
      "category": "taxes",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-notifications-8",
      "name": "Notifications backup",
      "category": "notifications",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
