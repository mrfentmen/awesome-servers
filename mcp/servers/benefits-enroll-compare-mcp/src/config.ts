import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-enroll-compare-mcp",
  "title": "benefits enroll compare Compare",
  "description": "Real local JSON analysis of benefits enroll compare in the HR & Hiring lane. 25 MCP tools, no paywall.",
  "prefix": "hr_benefits_enroll_compare",
  "entity": "benefits enroll compare item",
  "categories": [
    {
      "id": "hr",
      "label": "hr",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "benefits-enroll",
      "label": "benefits-enroll",
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
      "id": "hr_benefits_enroll_compare-hr-1",
      "name": "hr primary",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-benefits-enroll-3",
      "name": "benefits-enroll primary",
      "category": "benefits-enroll",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-hr-5",
      "name": "hr backup",
      "category": "hr",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-benefits-enroll-7",
      "name": "benefits-enroll backup",
      "category": "benefits-enroll",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
      "id": "hr_benefits_enroll_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "hr-hiring",
        "benefits",
        "enroll"
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
