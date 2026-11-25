import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-first-aid-build-plan-mcp",
  "title": "Home First Aid Build Planner Planner",
  "description": "Real local JSON analysis of home first aid build planner in the EMS First Response lane. 25 MCP tools, no paywall.",
  "prefix": "ems_first_response_home_first_aid_build_plan",
  "entity": "home first aid build planner item",
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
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
      "id": "ems_first_response_home_first_aid_build_plan-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
      "id": "ems_first_response_home_first_aid_build_plan-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "ems-first-response",
        "home",
        "first"
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
