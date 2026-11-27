import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "maintenance-ticket-audit-mcp",
  "title": "maintenance ticket audit Audit",
  "description": "Real local JSON analysis of maintenance ticket audit in the Property & Insurance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "prop_maintenance_ticket_audit",
  "entity": "maintenance ticket audit item",
  "categories": [
    {
      "id": "prop",
      "label": "prop",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "maintenance-ticket",
      "label": "maintenance-ticket",
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
        "prop"
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
      "id": "prop_maintenance_ticket_audit-prop-1",
      "name": "prop primary",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-maintenance-ticket-3",
      "name": "maintenance-ticket primary",
      "category": "maintenance-ticket",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-prop-5",
      "name": "prop backup",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-maintenance-ticket-7",
      "name": "maintenance-ticket backup",
      "category": "maintenance-ticket",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
      "id": "prop_maintenance_ticket_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "maintenance",
        "ticket"
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
