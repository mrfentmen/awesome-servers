import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-probate-document-pack-check-mcp",
  "title": "Probate Document Pack Audit",
  "description": "Audit probate document pack by court forms, death certificate, will, asset list coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_probate_document_pack",
  "entity": "probate document pack item",
  "categories": [
    {
      "id": "court-forms",
      "label": "Court forms",
      "baseline": 2
    },
    {
      "id": "death-certificate",
      "label": "Death certificate",
      "baseline": 2
    },
    {
      "id": "will",
      "label": "Will",
      "baseline": 2
    },
    {
      "id": "asset-list",
      "label": "Asset list",
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
        "court-forms"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "asset-list"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_probate_document_pack-court-forms-1",
      "name": "Court forms primary",
      "category": "court-forms",
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
      "id": "estate_probate_document_pack-death-certificate-2",
      "name": "Death certificate primary",
      "category": "death-certificate",
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
      "id": "estate_probate_document_pack-will-3",
      "name": "Will primary",
      "category": "will",
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
      "id": "estate_probate_document_pack-asset-list-4",
      "name": "Asset list primary",
      "category": "asset-list",
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
      "id": "estate_probate_document_pack-court-forms-5",
      "name": "Court forms backup",
      "category": "court-forms",
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
      "id": "estate_probate_document_pack-death-certificate-6",
      "name": "Death certificate backup",
      "category": "death-certificate",
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
      "id": "estate_probate_document_pack-will-7",
      "name": "Will backup",
      "category": "will",
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
      "id": "estate_probate_document_pack-asset-list-8",
      "name": "Asset list backup",
      "category": "asset-list",
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
