import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "roadside-assist-audit-mcp",
  "title": "roadside-assist audit Audit",
  "description": "Real local JSON analysis of roadside-assist audit in the Auto Buying & Ownership lane. 25 MCP tools, no paywall.",
  "prefix": "auto_roadside_assist_audit",
  "entity": "roadside-assist audit item",
  "categories": [
    {
      "id": "auto",
      "label": "auto",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "roadside-assist",
      "label": "roadside-assist",
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
        "auto"
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
      "id": "auto_roadside_assist_audit-auto-1",
      "name": "auto primary",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-roadside-assist-3",
      "name": "roadside-assist primary",
      "category": "roadside-assist",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-auto-5",
      "name": "auto backup",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-roadside-assist-7",
      "name": "roadside-assist backup",
      "category": "roadside-assist",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
      "id": "auto_roadside_assist_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "roadside",
        "assist"
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
