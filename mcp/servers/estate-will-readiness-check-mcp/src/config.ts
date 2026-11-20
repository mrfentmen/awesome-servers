import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-will-readiness-check-mcp",
  "title": "Will Readiness Audit",
  "description": "Audit will readiness by executor, guardians, bequests, signatures coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_will_readiness",
  "entity": "will readiness item",
  "categories": [
    {
      "id": "executor",
      "label": "Executor",
      "baseline": 2
    },
    {
      "id": "guardians",
      "label": "Guardians",
      "baseline": 2
    },
    {
      "id": "bequests",
      "label": "Bequests",
      "baseline": 2
    },
    {
      "id": "signatures",
      "label": "Signatures",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 90,
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
        "executor"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "signatures"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_will_readiness-executor-1",
      "name": "Executor primary",
      "category": "executor",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-guardians-2",
      "name": "Guardians primary",
      "category": "guardians",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-bequests-3",
      "name": "Bequests primary",
      "category": "bequests",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-signatures-4",
      "name": "Signatures primary",
      "category": "signatures",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-executor-5",
      "name": "Executor backup",
      "category": "executor",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-guardians-6",
      "name": "Guardians backup",
      "category": "guardians",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-bequests-7",
      "name": "Bequests backup",
      "category": "bequests",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_will_readiness-signatures-8",
      "name": "Signatures backup",
      "category": "signatures",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
