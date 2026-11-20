import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-medicare-plan-compare-check-mcp",
  "title": "Medicare Plan Compare Audit",
  "description": "Audit medicare plan compare by premium, deductible, drugs, network coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_medicare_plan_compare",
  "entity": "medicare plan compare item",
  "categories": [
    {
      "id": "premium",
      "label": "Premium",
      "baseline": 2
    },
    {
      "id": "deductible",
      "label": "Deductible",
      "baseline": 2
    },
    {
      "id": "drugs",
      "label": "Drugs",
      "baseline": 2
    },
    {
      "id": "network",
      "label": "Network",
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
        "premium"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "network"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_medicare_plan_compare-premium-1",
      "name": "Premium primary",
      "category": "premium",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-deductible-2",
      "name": "Deductible primary",
      "category": "deductible",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-drugs-3",
      "name": "Drugs primary",
      "category": "drugs",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-network-4",
      "name": "Network primary",
      "category": "network",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-premium-5",
      "name": "Premium backup",
      "category": "premium",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-deductible-6",
      "name": "Deductible backup",
      "category": "deductible",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-drugs-7",
      "name": "Drugs backup",
      "category": "drugs",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_medicare_plan_compare-network-8",
      "name": "Network backup",
      "category": "network",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
