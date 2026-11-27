import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skin-consult-audit-mcp",
  "title": "skin consult audit Audit",
  "description": "Real local JSON analysis of skin consult audit in the Beauty & Body lane. 25 MCP tools, no paywall.",
  "prefix": "beauty_skin_consult_audit",
  "entity": "skin consult audit item",
  "categories": [
    {
      "id": "beauty",
      "label": "beauty",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "skin-consult",
      "label": "skin-consult",
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
        "beauty"
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
      "id": "beauty_skin_consult_audit-beauty-1",
      "name": "beauty primary",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-skin-consult-3",
      "name": "skin-consult primary",
      "category": "skin-consult",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-beauty-5",
      "name": "beauty backup",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-skin-consult-7",
      "name": "skin-consult backup",
      "category": "skin-consult",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
      "id": "beauty_skin_consult_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "skin",
        "consult"
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
