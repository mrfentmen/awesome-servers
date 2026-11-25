import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "appliance-repair-audit-mcp",
  "title": "appliance-repair audit Audit",
  "description": "Real local JSON analysis of appliance-repair audit in the Home Services & Moving lane. 25 MCP tools, no paywall.",
  "prefix": "homeservices_appliance_repair_audit",
  "entity": "appliance-repair audit item",
  "categories": [
    {
      "id": "homeservices",
      "label": "homeservices",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "appliance-repair",
      "label": "appliance-repair",
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
      "id": "homeservices_appliance_repair_audit-homeservices-1",
      "name": "homeservices primary",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-appliance-repair-3",
      "name": "appliance-repair primary",
      "category": "appliance-repair",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-homeservices-5",
      "name": "homeservices backup",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-appliance-repair-7",
      "name": "appliance-repair backup",
      "category": "appliance-repair",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
      "id": "homeservices_appliance_repair_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "home-services-moving",
        "appliance",
        "repair"
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
