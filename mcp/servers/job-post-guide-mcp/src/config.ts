import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-post-guide-mcp",
  "title": "job post guide Guide",
  "description": "Real local JSON analysis of job post guide in the HR & Hiring lane. 25 MCP tools, no paywall.",
  "prefix": "hr_job_post_guide",
  "entity": "job post guide item",
  "categories": [
    {
      "id": "hr",
      "label": "hr",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "job-post",
      "label": "job-post",
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
        "hr"
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
      "id": "hr_job_post_guide-hr-1",
      "name": "hr primary",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-job-post-3",
      "name": "job-post primary",
      "category": "job-post",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-hr-5",
      "name": "hr backup",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-job-post-7",
      "name": "job-post backup",
      "category": "job-post",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
      "id": "hr_job_post_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "job",
        "post"
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
