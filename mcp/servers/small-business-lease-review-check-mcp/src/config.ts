import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-business-lease-review-check-mcp",
  "title": "Business Lease Review Audit",
  "description": "Audit business lease review by rent, term, repairs, exit coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "small_business_lease_review",
  "entity": "business lease review item",
  "categories": [
    {
      "id": "rent",
      "label": "Rent",
      "baseline": 2
    },
    {
      "id": "term",
      "label": "Term",
      "baseline": 2
    },
    {
      "id": "repairs",
      "label": "Repairs",
      "baseline": 2
    },
    {
      "id": "exit",
      "label": "Exit",
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
        "rent"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "exit"
      ]
    }
  ],
  "sample": [
    {
      "id": "small_business_lease_review-rent-1",
      "name": "Rent primary",
      "category": "rent",
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
      "id": "small_business_lease_review-term-2",
      "name": "Term primary",
      "category": "term",
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
      "id": "small_business_lease_review-repairs-3",
      "name": "Repairs primary",
      "category": "repairs",
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
      "id": "small_business_lease_review-exit-4",
      "name": "Exit primary",
      "category": "exit",
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
      "id": "small_business_lease_review-rent-5",
      "name": "Rent backup",
      "category": "rent",
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
      "id": "small_business_lease_review-term-6",
      "name": "Term backup",
      "category": "term",
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
      "id": "small_business_lease_review-repairs-7",
      "name": "Repairs backup",
      "category": "repairs",
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
      "id": "small_business_lease_review-exit-8",
      "name": "Exit backup",
      "category": "exit",
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
