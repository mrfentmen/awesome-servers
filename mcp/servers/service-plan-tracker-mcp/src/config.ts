import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "service-plan-tracker-mcp",
  "title": "service plan tracker Tracker",
  "description": "Real local JSON analysis of service plan tracker in the Faith & Community Ops lane. 25 MCP tools, no paywall.",
  "prefix": "faith_service_plan_tracker",
  "entity": "service plan tracker item",
  "categories": [
    {
      "id": "faith",
      "label": "faith",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "service-plan",
      "label": "service-plan",
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
        "faith"
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
      "id": "faith_service_plan_tracker-faith-1",
      "name": "faith primary",
      "category": "faith",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-service-plan-3",
      "name": "service-plan primary",
      "category": "service-plan",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-faith-5",
      "name": "faith backup",
      "category": "faith",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-service-plan-7",
      "name": "service-plan backup",
      "category": "service-plan",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
      "id": "faith_service_plan_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "faith-community-ops",
        "service",
        "plan"
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
