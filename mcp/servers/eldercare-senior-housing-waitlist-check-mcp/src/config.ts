import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-senior-housing-waitlist-check-mcp",
  "title": "Senior Housing Waitlist Audit",
  "description": "Audit senior housing waitlist by applications, deposits, preferences, backup coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_senior_housing_waitlist",
  "entity": "senior housing waitlist item",
  "categories": [
    {
      "id": "applications",
      "label": "Applications",
      "baseline": 2
    },
    {
      "id": "deposits",
      "label": "Deposits",
      "baseline": 2
    },
    {
      "id": "preferences",
      "label": "Preferences",
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
        "applications"
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
      "id": "eldercare_senior_housing_waitlist-applications-1",
      "name": "Applications primary",
      "category": "applications",
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
      "id": "eldercare_senior_housing_waitlist-deposits-2",
      "name": "Deposits primary",
      "category": "deposits",
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
      "id": "eldercare_senior_housing_waitlist-preferences-3",
      "name": "Preferences primary",
      "category": "preferences",
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
      "id": "eldercare_senior_housing_waitlist-backup-4",
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
      "id": "eldercare_senior_housing_waitlist-applications-5",
      "name": "Applications backup",
      "category": "applications",
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
      "id": "eldercare_senior_housing_waitlist-deposits-6",
      "name": "Deposits backup",
      "category": "deposits",
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
      "id": "eldercare_senior_housing_waitlist-preferences-7",
      "name": "Preferences backup",
      "category": "preferences",
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
      "id": "eldercare_senior_housing_waitlist-backup-8",
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
