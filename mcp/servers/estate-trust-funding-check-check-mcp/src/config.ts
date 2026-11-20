import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-trust-funding-check-check-mcp",
  "title": "Trust Funding Check Audit",
  "description": "Audit trust funding check by title, beneficiaries, accounts, property coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_trust_funding_check",
  "entity": "trust funding check item",
  "categories": [
    {
      "id": "title",
      "label": "Title",
      "baseline": 2
    },
    {
      "id": "beneficiaries",
      "label": "Beneficiaries",
      "baseline": 2
    },
    {
      "id": "accounts",
      "label": "Accounts",
      "baseline": 2
    },
    {
      "id": "property",
      "label": "Property",
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
        "title"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "property"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_trust_funding_check-title-1",
      "name": "Title primary",
      "category": "title",
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
      "id": "estate_trust_funding_check-beneficiaries-2",
      "name": "Beneficiaries primary",
      "category": "beneficiaries",
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
      "id": "estate_trust_funding_check-accounts-3",
      "name": "Accounts primary",
      "category": "accounts",
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
      "id": "estate_trust_funding_check-property-4",
      "name": "Property primary",
      "category": "property",
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
      "id": "estate_trust_funding_check-title-5",
      "name": "Title backup",
      "category": "title",
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
      "id": "estate_trust_funding_check-beneficiaries-6",
      "name": "Beneficiaries backup",
      "category": "beneficiaries",
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
      "id": "estate_trust_funding_check-accounts-7",
      "name": "Accounts backup",
      "category": "accounts",
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
      "id": "estate_trust_funding_check-property-8",
      "name": "Property backup",
      "category": "property",
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
