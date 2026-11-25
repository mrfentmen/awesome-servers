import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "storage-unit-checklist-mcp",
  "title": "storage-unit checklist Checklist",
  "description": "Real local JSON analysis of storage-unit checklist in the Home Services & Moving lane. 25 MCP tools, no paywall.",
  "prefix": "homeservices_storage_unit_checklist",
  "entity": "storage-unit checklist item",
  "categories": [
    {
      "id": "homeservices",
      "label": "homeservices",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "storage-unit",
      "label": "storage-unit",
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
        "homeservices"
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
      "id": "homeservices_storage_unit_checklist-homeservices-1",
      "name": "homeservices primary",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-storage-unit-3",
      "name": "storage-unit primary",
      "category": "storage-unit",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-homeservices-5",
      "name": "homeservices backup",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-storage-unit-7",
      "name": "storage-unit backup",
      "category": "storage-unit",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
      "id": "homeservices_storage_unit_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "storage",
        "unit"
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
