import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-freelance-rate-check-mcp",
  "title": "Freelance Rate Audit",
  "description": "Audit freelance rate by hours, costs, market, tax coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_freelance_rate",
  "entity": "freelance rate item",
  "categories": [
    {
      "id": "hours",
      "label": "Hours",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "market",
      "label": "Market",
      "baseline": 2
    },
    {
      "id": "tax",
      "label": "Tax",
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
        "hours"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "tax"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_freelance_rate-hours-1",
      "name": "Hours primary",
      "category": "hours",
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
      "id": "job_freelance_rate-costs-2",
      "name": "Costs primary",
      "category": "costs",
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
      "id": "job_freelance_rate-market-3",
      "name": "Market primary",
      "category": "market",
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
      "id": "job_freelance_rate-tax-4",
      "name": "Tax primary",
      "category": "tax",
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
      "id": "job_freelance_rate-hours-5",
      "name": "Hours backup",
      "category": "hours",
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
      "id": "job_freelance_rate-costs-6",
      "name": "Costs backup",
      "category": "costs",
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
      "id": "job_freelance_rate-market-7",
      "name": "Market backup",
      "category": "market",
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
      "id": "job_freelance_rate-tax-8",
      "name": "Tax backup",
      "category": "tax",
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
