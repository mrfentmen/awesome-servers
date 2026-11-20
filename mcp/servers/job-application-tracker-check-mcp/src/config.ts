import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-application-tracker-check-mcp",
  "title": "Application Tracker Audit",
  "description": "Audit application tracker by applied, interview, offer, follow-up coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "job_application_tracker",
  "entity": "application tracker item",
  "categories": [
    {
      "id": "applied",
      "label": "Applied",
      "baseline": 2
    },
    {
      "id": "interview",
      "label": "Interview",
      "baseline": 2
    },
    {
      "id": "offer",
      "label": "Offer",
      "baseline": 2
    },
    {
      "id": "follow-up",
      "label": "Follow-up",
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
        "applied"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "follow-up"
      ]
    }
  ],
  "sample": [
    {
      "id": "job_application_tracker-applied-1",
      "name": "Applied primary",
      "category": "applied",
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
      "id": "job_application_tracker-interview-2",
      "name": "Interview primary",
      "category": "interview",
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
      "id": "job_application_tracker-offer-3",
      "name": "Offer primary",
      "category": "offer",
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
      "id": "job_application_tracker-follow-up-4",
      "name": "Follow-up primary",
      "category": "follow-up",
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
      "id": "job_application_tracker-applied-5",
      "name": "Applied backup",
      "category": "applied",
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
      "id": "job_application_tracker-interview-6",
      "name": "Interview backup",
      "category": "interview",
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
      "id": "job_application_tracker-offer-7",
      "name": "Offer backup",
      "category": "offer",
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
      "id": "job_application_tracker-follow-up-8",
      "name": "Follow-up backup",
      "category": "follow-up",
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
