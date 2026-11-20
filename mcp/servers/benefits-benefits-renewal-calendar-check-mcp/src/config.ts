import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-benefits-renewal-calendar-check-mcp",
  "title": "Benefits Renewal Calendar Audit",
  "description": "Audit benefits renewal calendar by annual, quarterly, documents, deadline coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_benefits_renewal_calendar",
  "entity": "benefits renewal calendar item",
  "categories": [
    {
      "id": "annual",
      "label": "Annual",
      "baseline": 2
    },
    {
      "id": "quarterly",
      "label": "Quarterly",
      "baseline": 2
    },
    {
      "id": "documents",
      "label": "Documents",
      "baseline": 2
    },
    {
      "id": "deadline",
      "label": "Deadline",
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
        "annual"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadline"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_benefits_renewal_calendar-annual-1",
      "name": "Annual primary",
      "category": "annual",
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
      "id": "benefits_benefits_renewal_calendar-quarterly-2",
      "name": "Quarterly primary",
      "category": "quarterly",
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
      "id": "benefits_benefits_renewal_calendar-documents-3",
      "name": "Documents primary",
      "category": "documents",
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
      "id": "benefits_benefits_renewal_calendar-deadline-4",
      "name": "Deadline primary",
      "category": "deadline",
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
      "id": "benefits_benefits_renewal_calendar-annual-5",
      "name": "Annual backup",
      "category": "annual",
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
      "id": "benefits_benefits_renewal_calendar-quarterly-6",
      "name": "Quarterly backup",
      "category": "quarterly",
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
      "id": "benefits_benefits_renewal_calendar-documents-7",
      "name": "Documents backup",
      "category": "documents",
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
      "id": "benefits_benefits_renewal_calendar-deadline-8",
      "name": "Deadline backup",
      "category": "deadline",
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
