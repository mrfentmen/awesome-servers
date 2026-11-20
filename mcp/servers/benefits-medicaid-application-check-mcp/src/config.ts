import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-medicaid-application-check-mcp",
  "title": "Medicaid Application Audit",
  "description": "Audit medicaid application by income, assets, medical, documents coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_medicaid_application",
  "entity": "medicaid application item",
  "categories": [
    {
      "id": "income",
      "label": "Income",
      "baseline": 2
    },
    {
      "id": "assets",
      "label": "Assets",
      "baseline": 2
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "documents",
      "label": "Documents",
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
        "income"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "documents"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_medicaid_application-income-1",
      "name": "Income primary",
      "category": "income",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-assets-2",
      "name": "Assets primary",
      "category": "assets",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-medical-3",
      "name": "Medical primary",
      "category": "medical",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-documents-4",
      "name": "Documents primary",
      "category": "documents",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-income-5",
      "name": "Income backup",
      "category": "income",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-assets-6",
      "name": "Assets backup",
      "category": "assets",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-medical-7",
      "name": "Medical backup",
      "category": "medical",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicaid_application-documents-8",
      "name": "Documents backup",
      "category": "documents",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
