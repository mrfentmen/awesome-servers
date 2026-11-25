import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "pet-insurance-audit-mcp",
  "title": "pet insurance audit Audit",
  "description": "Real local JSON analysis of pet insurance audit in the Pets & Animals lane. 25 MCP tools, no paywall.",
  "prefix": "pets_pet_insurance_audit",
  "entity": "pet insurance audit item",
  "categories": [
    {
      "id": "pets",
      "label": "pets",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "pet-insurance",
      "label": "pet-insurance",
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
    "target": 7,
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
        "pets"
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
      "id": "pets_pet_insurance_audit-pets-1",
      "name": "pets primary",
      "category": "pets",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-pet-insurance-3",
      "name": "pet-insurance primary",
      "category": "pet-insurance",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-pets-5",
      "name": "pets backup",
      "category": "pets",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-pet-insurance-7",
      "name": "pet-insurance backup",
      "category": "pet-insurance",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
      "id": "pets_pet_insurance_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "pet",
        "insurance"
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
