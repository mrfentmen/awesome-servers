import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-salary-benchmark-check-mcp",
  "title": "Salary Benchmark Audit",
  "description": "Audit salary benchmark by title, location, experience, range coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_salary_benchmark",
  "entity": "salary benchmark item",
  "categories": [
    {
      "id": "title",
      "label": "Title",
      "baseline": 2
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 2
    },
    {
      "id": "experience",
      "label": "Experience",
      "baseline": 2
    },
    {
      "id": "range",
      "label": "Range",
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
        "title"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "range"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_salary_benchmark-title-1",
      "name": "Title primary",
      "category": "title",
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
      "id": "job_salary_benchmark-location-2",
      "name": "Location primary",
      "category": "location",
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
      "id": "job_salary_benchmark-experience-3",
      "name": "Experience primary",
      "category": "experience",
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
      "id": "job_salary_benchmark-range-4",
      "name": "Range primary",
      "category": "range",
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
      "id": "job_salary_benchmark-title-5",
      "name": "Title backup",
      "category": "title",
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
      "id": "job_salary_benchmark-location-6",
      "name": "Location backup",
      "category": "location",
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
      "id": "job_salary_benchmark-experience-7",
      "name": "Experience backup",
      "category": "experience",
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
      "id": "job_salary_benchmark-range-8",
      "name": "Range backup",
      "category": "range",
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
