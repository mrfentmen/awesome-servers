import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-beneficiary-gap-check-check-mcp",
  "title": "Beneficiary Gap Check Audit",
  "description": "Audit beneficiary gap check by retirement, insurance, bank, property coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_beneficiary_gap_check",
  "entity": "beneficiary gap check item",
  "categories": [
    {
      "id": "retirement",
      "label": "Retirement",
      "baseline": 2
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 2
    },
    {
      "id": "bank",
      "label": "Bank",
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
        "retirement"
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
      "id": "estate_beneficiary_gap_check-retirement-1",
      "name": "Retirement primary",
      "category": "retirement",
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
      "id": "estate_beneficiary_gap_check-insurance-2",
      "name": "Insurance primary",
      "category": "insurance",
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
      "id": "estate_beneficiary_gap_check-bank-3",
      "name": "Bank primary",
      "category": "bank",
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
      "id": "estate_beneficiary_gap_check-property-4",
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
      "id": "estate_beneficiary_gap_check-retirement-5",
      "name": "Retirement backup",
      "category": "retirement",
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
      "id": "estate_beneficiary_gap_check-insurance-6",
      "name": "Insurance backup",
      "category": "insurance",
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
      "id": "estate_beneficiary_gap_check-bank-7",
      "name": "Bank backup",
      "category": "bank",
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
      "id": "estate_beneficiary_gap_check-property-8",
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
