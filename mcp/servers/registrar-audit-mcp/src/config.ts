import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "registrar-audit-mcp",
  "title": "registrar audit Audit",
  "description": "Real local JSON analysis of registrar audit in the Universities lane. 25 MCP tools, no paywall.",
  "prefix": "highered_registrar_audit",
  "entity": "registrar audit item",
  "categories": [
    {
      "id": "highered",
      "label": "highered",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "registrar",
      "label": "registrar",
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
        "highered"
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
      "id": "highered_registrar_audit-highered-1",
      "name": "highered primary",
      "category": "highered",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-registrar-3",
      "name": "registrar primary",
      "category": "registrar",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-highered-5",
      "name": "highered backup",
      "category": "highered",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-registrar-7",
      "name": "registrar backup",
      "category": "registrar",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
      "id": "highered_registrar_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "universities",
        "registrar",
        "audit"
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
