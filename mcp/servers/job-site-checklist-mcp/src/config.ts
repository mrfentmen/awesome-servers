import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "job-site-checklist-mcp",
  "title": "job site checklist Checklist",
  "description": "Real local JSON analysis of job site checklist in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_job_site_checklist",
  "entity": "job site checklist item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "job-site",
      "label": "job-site",
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
        "build"
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
      "id": "build_job_site_checklist-build-1",
      "name": "build primary",
      "category": "build",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-job-site-3",
      "name": "job-site primary",
      "category": "job-site",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-build-5",
      "name": "build backup",
      "category": "build",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-job-site-7",
      "name": "job-site backup",
      "category": "job-site",
      "tags": [
        "build-factory",
        "job",
        "site"
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
      "id": "build_job_site_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "build-factory",
        "job",
        "site"
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
