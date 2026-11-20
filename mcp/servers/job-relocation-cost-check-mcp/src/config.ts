import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-relocation-cost-check-mcp",
  "title": "Relocation Cost Audit",
  "description": "Audit relocation cost by housing, moving, commute, tax coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_relocation_cost",
  "entity": "relocation cost item",
  "categories": [
    {
      "id": "housing",
      "label": "Housing",
      "baseline": 2
    },
    {
      "id": "moving",
      "label": "Moving",
      "baseline": 2
    },
    {
      "id": "commute",
      "label": "Commute",
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
        "housing"
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
      "id": "job_relocation_cost-housing-1",
      "name": "Housing primary",
      "category": "housing",
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
      "id": "job_relocation_cost-moving-2",
      "name": "Moving primary",
      "category": "moving",
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
      "id": "job_relocation_cost-commute-3",
      "name": "Commute primary",
      "category": "commute",
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
      "id": "job_relocation_cost-tax-4",
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
      "id": "job_relocation_cost-housing-5",
      "name": "Housing backup",
      "category": "housing",
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
      "id": "job_relocation_cost-moving-6",
      "name": "Moving backup",
      "category": "moving",
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
      "id": "job_relocation_cost-commute-7",
      "name": "Commute backup",
      "category": "commute",
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
      "id": "job_relocation_cost-tax-8",
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
