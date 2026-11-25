import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "529-plan-guide-mcp",
  "title": "529-plan guide Guide",
  "description": "Real local JSON analysis of 529-plan guide in the Personal Finance lane. 25 MCP tools, no paywall.",
  "prefix": "finance_529_plan_guide",
  "entity": "529-plan guide item",
  "categories": [
    {
      "id": "finance",
      "label": "finance",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "529-plan",
      "label": "529-plan",
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
        "finance"
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
      "id": "finance_529_plan_guide-finance-1",
      "name": "finance primary",
      "category": "finance",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-529-plan-3",
      "name": "529-plan primary",
      "category": "529-plan",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-finance-5",
      "name": "finance backup",
      "category": "finance",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-529-plan-7",
      "name": "529-plan backup",
      "category": "529-plan",
      "tags": [
        "personal-finance",
        "529",
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
      "id": "finance_529_plan_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "529",
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
