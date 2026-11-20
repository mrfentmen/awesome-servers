import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-business-hiring-compliance-check-mcp",
  "title": "Hiring Compliance Audit",
  "description": "Audit hiring compliance by posting, i-9, policy, training coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "small_business_hiring_compliance",
  "entity": "hiring compliance item",
  "categories": [
    {
      "id": "posting",
      "label": "Posting",
      "baseline": 2
    },
    {
      "id": "i-9",
      "label": "I-9",
      "baseline": 2
    },
    {
      "id": "policy",
      "label": "Policy",
      "baseline": 2
    },
    {
      "id": "training",
      "label": "Training",
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
        "posting"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "training"
      ]
    }
  ],
  "sample": [
    {
      "id": "small_business_hiring_compliance-posting-1",
      "name": "Posting primary",
      "category": "posting",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-i-9-2",
      "name": "I-9 primary",
      "category": "i-9",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-policy-3",
      "name": "Policy primary",
      "category": "policy",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-training-4",
      "name": "Training primary",
      "category": "training",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-posting-5",
      "name": "Posting backup",
      "category": "posting",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-i-9-6",
      "name": "I-9 backup",
      "category": "i-9",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-policy-7",
      "name": "Policy backup",
      "category": "policy",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_hiring_compliance-training-8",
      "name": "Training backup",
      "category": "training",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
