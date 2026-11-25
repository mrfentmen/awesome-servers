import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "substitute-plan-planner-mcp",
  "title": "substitute plan planner Planner",
  "description": "Real local JSON analysis of substitute plan planner in the K-12 Schools lane. 25 MCP tools, no paywall.",
  "prefix": "k12_substitute_plan_planner",
  "entity": "substitute plan planner item",
  "categories": [
    {
      "id": "k12",
      "label": "k12",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "substitute-plan",
      "label": "substitute-plan",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
        "k12"
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
      "id": "k12_substitute_plan_planner-k12-1",
      "name": "k12 primary",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-substitute-plan-3",
      "name": "substitute-plan primary",
      "category": "substitute-plan",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-k12-5",
      "name": "k12 backup",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-substitute-plan-7",
      "name": "substitute-plan backup",
      "category": "substitute-plan",
      "tags": [
        "k-12-schools",
        "substitute",
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
      "id": "k12_substitute_plan_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "substitute",
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
