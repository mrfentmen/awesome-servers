import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-offer-compare-check-mcp",
  "title": "Offer Compare Audit",
  "description": "Audit offer compare by base, bonus, equity, benefits coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_offer_compare",
  "entity": "offer compare item",
  "categories": [
    {
      "id": "base",
      "label": "Base",
      "baseline": 2
    },
    {
      "id": "bonus",
      "label": "Bonus",
      "baseline": 2
    },
    {
      "id": "equity",
      "label": "Equity",
      "baseline": 2
    },
    {
      "id": "benefits",
      "label": "Benefits",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since last action",
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
        "base"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "benefits"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_offer_compare-base-1",
      "name": "Base primary",
      "category": "base",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-bonus-2",
      "name": "Bonus primary",
      "category": "bonus",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-equity-3",
      "name": "Equity primary",
      "category": "equity",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-benefits-4",
      "name": "Benefits primary",
      "category": "benefits",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-base-5",
      "name": "Base backup",
      "category": "base",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-bonus-6",
      "name": "Bonus backup",
      "category": "bonus",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-equity-7",
      "name": "Equity backup",
      "category": "equity",
      "tags": [
        "jobs",
        "career",
        "salary"
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
      "id": "job_offer_compare-benefits-8",
      "name": "Benefits backup",
      "category": "benefits",
      "tags": [
        "jobs",
        "career",
        "salary"
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
