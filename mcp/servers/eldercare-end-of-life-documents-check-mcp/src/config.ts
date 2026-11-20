import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-end-of-life-documents-check-mcp",
  "title": "End-of-Life Documents Audit",
  "description": "Audit end-of-life documents by will, directives, beneficiaries, contacts coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_end_of_life_documents",
  "entity": "end-of-life documents item",
  "categories": [
    {
      "id": "will",
      "label": "Will",
      "baseline": 2
    },
    {
      "id": "directives",
      "label": "Directives",
      "baseline": 2
    },
    {
      "id": "beneficiaries",
      "label": "Beneficiaries",
      "baseline": 2
    },
    {
      "id": "contacts",
      "label": "Contacts",
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
        "will"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "contacts"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_end_of_life_documents-will-1",
      "name": "Will primary",
      "category": "will",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-directives-2",
      "name": "Directives primary",
      "category": "directives",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-beneficiaries-3",
      "name": "Beneficiaries primary",
      "category": "beneficiaries",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-contacts-4",
      "name": "Contacts primary",
      "category": "contacts",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-will-5",
      "name": "Will backup",
      "category": "will",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-directives-6",
      "name": "Directives backup",
      "category": "directives",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-beneficiaries-7",
      "name": "Beneficiaries backup",
      "category": "beneficiaries",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-contacts-8",
      "name": "Contacts backup",
      "category": "contacts",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
