import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "onboarding-plan-tracker-mcp",
  "title": "onboarding plan tracker Tracker",
  "description": "Real local JSON analysis of onboarding plan tracker in the HR & Hiring lane. 25 MCP tools, no paywall.",
  "prefix": "hr_onboarding_plan_tracker",
  "entity": "onboarding plan tracker item",
  "categories": [
    {
      "id": "hr",
      "label": "hr",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "onboarding-plan",
      "label": "onboarding-plan",
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
        "hr"
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
      "id": "hr_onboarding_plan_tracker-hr-1",
      "name": "hr primary",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-onboarding-plan-3",
      "name": "onboarding-plan primary",
      "category": "onboarding-plan",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-hr-5",
      "name": "hr backup",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-onboarding-plan-7",
      "name": "onboarding-plan backup",
      "category": "onboarding-plan",
      "tags": [
        "hr-hiring",
        "onboarding",
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
      "id": "hr_onboarding_plan_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "onboarding",
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
