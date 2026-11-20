import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-in-home-care-compare-check-mcp",
  "title": "In-Home Care Compare Audit",
  "description": "Audit in-home care compare by hours, rate, services, backup coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_in_home_care_compare",
  "entity": "in-home care compare item",
  "categories": [
    {
      "id": "hours",
      "label": "Hours",
      "baseline": 2
    },
    {
      "id": "rate",
      "label": "Rate",
      "baseline": 2
    },
    {
      "id": "services",
      "label": "Services",
      "baseline": 2
    },
    {
      "id": "backup",
      "label": "Backup",
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
        "hours"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "backup"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_in_home_care_compare-hours-1",
      "name": "Hours primary",
      "category": "hours",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-rate-2",
      "name": "Rate primary",
      "category": "rate",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-services-3",
      "name": "Services primary",
      "category": "services",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-backup-4",
      "name": "Backup primary",
      "category": "backup",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-hours-5",
      "name": "Hours backup",
      "category": "hours",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-rate-6",
      "name": "Rate backup",
      "category": "rate",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-services-7",
      "name": "Services backup",
      "category": "services",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_in_home_care_compare-backup-8",
      "name": "Backup backup",
      "category": "backup",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
