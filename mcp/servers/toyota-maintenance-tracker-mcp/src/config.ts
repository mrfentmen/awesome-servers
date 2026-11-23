import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "toyota-maintenance-tracker-mcp",
  "title": "Toyota Maintenance Tracker Tracker",
  "description": "Real local JSON analysis of toyota maintenance tracker in the Toyota Maintenance lane. 25 MCP tools, no paywall.",
  "prefix": "toyota_maintenance_toyota_maintenance_tracker",
  "entity": "toyota maintenance tracker item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "toyota_maintenance_toyota_maintenance_tracker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
      "id": "toyota_maintenance_toyota_maintenance_tracker-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "toyota-maintenance",
        "toyota",
        "maintenance"
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
