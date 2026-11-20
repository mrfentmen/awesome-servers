import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-social-isolation-check-check-mcp",
  "title": "Social Isolation Check Audit",
  "description": "Audit social isolation check by visits, calls, activities, transport coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_social_isolation_check",
  "entity": "social isolation check item",
  "categories": [
    {
      "id": "visits",
      "label": "Visits",
      "baseline": 2
    },
    {
      "id": "calls",
      "label": "Calls",
      "baseline": 2
    },
    {
      "id": "activities",
      "label": "Activities",
      "baseline": 2
    },
    {
      "id": "transport",
      "label": "Transport",
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
        "visits"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "transport"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_social_isolation_check-visits-1",
      "name": "Visits primary",
      "category": "visits",
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
      "id": "eldercare_social_isolation_check-calls-2",
      "name": "Calls primary",
      "category": "calls",
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
      "id": "eldercare_social_isolation_check-activities-3",
      "name": "Activities primary",
      "category": "activities",
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
      "id": "eldercare_social_isolation_check-transport-4",
      "name": "Transport primary",
      "category": "transport",
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
      "id": "eldercare_social_isolation_check-visits-5",
      "name": "Visits backup",
      "category": "visits",
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
      "id": "eldercare_social_isolation_check-calls-6",
      "name": "Calls backup",
      "category": "calls",
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
      "id": "eldercare_social_isolation_check-activities-7",
      "name": "Activities backup",
      "category": "activities",
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
      "id": "eldercare_social_isolation_check-transport-8",
      "name": "Transport backup",
      "category": "transport",
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
