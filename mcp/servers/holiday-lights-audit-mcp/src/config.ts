import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "holiday-lights-audit-mcp",
  "title": "holiday lights audit Audit",
  "description": "Real local JSON analysis of holiday lights audit in the Events & Celebrations lane. 25 MCP tools, no paywall.",
  "prefix": "events_holiday_lights_audit",
  "entity": "holiday lights audit item",
  "categories": [
    {
      "id": "events",
      "label": "events",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "holiday-lights",
      "label": "holiday-lights",
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
        "events"
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
      "id": "events_holiday_lights_audit-events-1",
      "name": "events primary",
      "category": "events",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-holiday-lights-3",
      "name": "holiday-lights primary",
      "category": "holiday-lights",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-events-5",
      "name": "events backup",
      "category": "events",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-holiday-lights-7",
      "name": "holiday-lights backup",
      "category": "holiday-lights",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
      "id": "events_holiday_lights_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "holiday",
        "lights"
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
