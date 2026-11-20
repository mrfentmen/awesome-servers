import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-inheritance-tax-estimate-check-mcp",
  "title": "Inheritance Tax Estimate Audit",
  "description": "Audit inheritance tax estimate by estate value, exemptions, rates, filings coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_inheritance_tax_estimate",
  "entity": "inheritance tax estimate item",
  "categories": [
    {
      "id": "estate-value",
      "label": "Estate value",
      "baseline": 2
    },
    {
      "id": "exemptions",
      "label": "Exemptions",
      "baseline": 2
    },
    {
      "id": "rates",
      "label": "Rates",
      "baseline": 2
    },
    {
      "id": "filings",
      "label": "Filings",
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
        "estate-value"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "filings"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_inheritance_tax_estimate-estate-value-1",
      "name": "Estate value primary",
      "category": "estate-value",
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
      "id": "estate_inheritance_tax_estimate-exemptions-2",
      "name": "Exemptions primary",
      "category": "exemptions",
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
      "id": "estate_inheritance_tax_estimate-rates-3",
      "name": "Rates primary",
      "category": "rates",
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
      "id": "estate_inheritance_tax_estimate-filings-4",
      "name": "Filings primary",
      "category": "filings",
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
      "id": "estate_inheritance_tax_estimate-estate-value-5",
      "name": "Estate value backup",
      "category": "estate-value",
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
      "id": "estate_inheritance_tax_estimate-exemptions-6",
      "name": "Exemptions backup",
      "category": "exemptions",
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
      "id": "estate_inheritance_tax_estimate-rates-7",
      "name": "Rates backup",
      "category": "rates",
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
      "id": "estate_inheritance_tax_estimate-filings-8",
      "name": "Filings backup",
      "category": "filings",
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
