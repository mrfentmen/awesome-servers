import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-transportation-plan-check-mcp",
  "title": "Transportation Plan Audit",
  "description": "Audit transportation plan by medical trips, errands, social trips, backup coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_transportation_plan",
  "entity": "transportation plan item",
  "categories": [
    {
      "id": "medical-trips",
      "label": "Medical trips",
      "baseline": 2
    },
    {
      "id": "errands",
      "label": "Errands",
      "baseline": 2
    },
    {
      "id": "social-trips",
      "label": "Social trips",
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
        "medical-trips"
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
      "id": "eldercare_transportation_plan-medical-trips-1",
      "name": "Medical trips primary",
      "category": "medical-trips",
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
      "id": "eldercare_transportation_plan-errands-2",
      "name": "Errands primary",
      "category": "errands",
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
      "id": "eldercare_transportation_plan-social-trips-3",
      "name": "Social trips primary",
      "category": "social-trips",
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
      "id": "eldercare_transportation_plan-backup-4",
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
      "id": "eldercare_transportation_plan-medical-trips-5",
      "name": "Medical trips backup",
      "category": "medical-trips",
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
      "id": "eldercare_transportation_plan-errands-6",
      "name": "Errands backup",
      "category": "errands",
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
      "id": "eldercare_transportation_plan-social-trips-7",
      "name": "Social trips backup",
      "category": "social-trips",
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
      "id": "eldercare_transportation_plan-backup-8",
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
