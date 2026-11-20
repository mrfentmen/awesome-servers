import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-interview-prep-check-mcp",
  "title": "Interview Prep Audit",
  "description": "Audit interview prep by company, role, stories, questions coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_interview_prep",
  "entity": "interview prep item",
  "categories": [
    {
      "id": "company",
      "label": "Company",
      "baseline": 2
    },
    {
      "id": "role",
      "label": "Role",
      "baseline": 2
    },
    {
      "id": "stories",
      "label": "Stories",
      "baseline": 2
    },
    {
      "id": "questions",
      "label": "Questions",
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
        "company"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "questions"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_interview_prep-company-1",
      "name": "Company primary",
      "category": "company",
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
      "id": "job_interview_prep-role-2",
      "name": "Role primary",
      "category": "role",
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
      "id": "job_interview_prep-stories-3",
      "name": "Stories primary",
      "category": "stories",
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
      "id": "job_interview_prep-questions-4",
      "name": "Questions primary",
      "category": "questions",
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
      "id": "job_interview_prep-company-5",
      "name": "Company backup",
      "category": "company",
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
      "id": "job_interview_prep-role-6",
      "name": "Role backup",
      "category": "role",
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
      "id": "job_interview_prep-stories-7",
      "name": "Stories backup",
      "category": "stories",
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
      "id": "job_interview_prep-questions-8",
      "name": "Questions backup",
      "category": "questions",
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
