import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "veteran-job-search-guide-mcp",
  "title": "Veteran Job Search Guide Guide",
  "description": "Real local JSON analysis of veteran job search guide in the Military lane. 25 MCP tools, no paywall.",
  "prefix": "military_veteran_job_search_guide",
  "entity": "veteran job search guide item",
  "categories": [
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "tips",
      "label": "Tips",
      "baseline": 2
    },
    {
      "id": "gear",
      "label": "Gear",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
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
        "steps"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "military_veteran_job_search_guide-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-tips-2",
      "name": "Tips primary",
      "category": "tips",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-gear-3",
      "name": "Gear primary",
      "category": "gear",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-tips-6",
      "name": "Tips backup",
      "category": "tips",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-gear-7",
      "name": "Gear backup",
      "category": "gear",
      "tags": [
        "military",
        "veteran",
        "job"
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
      "id": "military_veteran_job_search_guide-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "military",
        "veteran",
        "job"
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
