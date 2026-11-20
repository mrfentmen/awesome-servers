import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-unemployment-claim-check-mcp",
  "title": "Unemployment Claim Audit",
  "description": "Audit unemployment claim by separation, wages, work search, weekly coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_unemployment_claim",
  "entity": "unemployment claim item",
  "categories": [
    {
      "id": "separation",
      "label": "Separation",
      "baseline": 2
    },
    {
      "id": "wages",
      "label": "Wages",
      "baseline": 2
    },
    {
      "id": "work-search",
      "label": "Work search",
      "baseline": 2
    },
    {
      "id": "weekly",
      "label": "Weekly",
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
        "separation"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "weekly"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_unemployment_claim-separation-1",
      "name": "Separation primary",
      "category": "separation",
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
      "id": "benefits_unemployment_claim-wages-2",
      "name": "Wages primary",
      "category": "wages",
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
      "id": "benefits_unemployment_claim-work-search-3",
      "name": "Work search primary",
      "category": "work-search",
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
      "id": "benefits_unemployment_claim-weekly-4",
      "name": "Weekly primary",
      "category": "weekly",
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
      "id": "benefits_unemployment_claim-separation-5",
      "name": "Separation backup",
      "category": "separation",
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
      "id": "benefits_unemployment_claim-wages-6",
      "name": "Wages backup",
      "category": "wages",
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
      "id": "benefits_unemployment_claim-work-search-7",
      "name": "Work search backup",
      "category": "work-search",
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
      "id": "benefits_unemployment_claim-weekly-8",
      "name": "Weekly backup",
      "category": "weekly",
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
