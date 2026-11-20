import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-resume-match-check-mcp",
  "title": "Resume Match Audit",
  "description": "Audit resume match by skills, experience, keywords, gaps coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_resume_match",
  "entity": "resume match item",
  "categories": [
    {
      "id": "skills",
      "label": "Skills",
      "baseline": 2
    },
    {
      "id": "experience",
      "label": "Experience",
      "baseline": 2
    },
    {
      "id": "keywords",
      "label": "Keywords",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
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
        "skills"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "gaps"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_resume_match-skills-1",
      "name": "Skills primary",
      "category": "skills",
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
      "id": "job_resume_match-experience-2",
      "name": "Experience primary",
      "category": "experience",
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
      "id": "job_resume_match-keywords-3",
      "name": "Keywords primary",
      "category": "keywords",
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
      "id": "job_resume_match-gaps-4",
      "name": "Gaps primary",
      "category": "gaps",
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
      "id": "job_resume_match-skills-5",
      "name": "Skills backup",
      "category": "skills",
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
      "id": "job_resume_match-experience-6",
      "name": "Experience backup",
      "category": "experience",
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
      "id": "job_resume_match-keywords-7",
      "name": "Keywords backup",
      "category": "keywords",
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
      "id": "job_resume_match-gaps-8",
      "name": "Gaps backup",
      "category": "gaps",
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
