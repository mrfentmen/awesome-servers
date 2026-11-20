import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-layoff-plan-check-mcp",
  "title": "Layoff Plan Audit",
  "description": "Audit layoff plan by budget, insurance, network, timeline coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_layoff_plan",
  "entity": "layoff plan item",
  "categories": [
    {
      "id": "budget",
      "label": "Budget",
      "baseline": 2
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 2
    },
    {
      "id": "network",
      "label": "Network",
      "baseline": 2
    },
    {
      "id": "timeline",
      "label": "Timeline",
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
        "budget"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "timeline"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_layoff_plan-budget-1",
      "name": "Budget primary",
      "category": "budget",
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
      "id": "job_layoff_plan-insurance-2",
      "name": "Insurance primary",
      "category": "insurance",
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
      "id": "job_layoff_plan-network-3",
      "name": "Network primary",
      "category": "network",
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
      "id": "job_layoff_plan-timeline-4",
      "name": "Timeline primary",
      "category": "timeline",
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
      "id": "job_layoff_plan-budget-5",
      "name": "Budget backup",
      "category": "budget",
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
      "id": "job_layoff_plan-insurance-6",
      "name": "Insurance backup",
      "category": "insurance",
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
      "id": "job_layoff_plan-network-7",
      "name": "Network backup",
      "category": "network",
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
      "id": "job_layoff_plan-timeline-8",
      "name": "Timeline backup",
      "category": "timeline",
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
