import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "certification-audit-mcp",
  "title": "certification audit Audit",
  "description": "Real local JSON analysis of certification audit in the Tutoring & Online Learning lane. 25 MCP tools, no paywall.",
  "prefix": "edtech_certification_audit",
  "entity": "certification audit item",
  "categories": [
    {
      "id": "edtech",
      "label": "edtech",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "certification",
      "label": "certification",
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
        "edtech"
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
      "id": "edtech_certification_audit-edtech-1",
      "name": "edtech primary",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-certification-3",
      "name": "certification primary",
      "category": "certification",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-edtech-5",
      "name": "edtech backup",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-certification-7",
      "name": "certification backup",
      "category": "certification",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
      "id": "edtech_certification_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "certification",
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
