import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "family-reunion-checklist-mcp",
  "title": "family reunion checklist Checklist",
  "description": "Real local JSON analysis of family reunion checklist in the Events & Celebrations lane. 25 MCP tools, no paywall.",
  "prefix": "events_family_reunion_checklist",
  "entity": "family reunion checklist item",
  "categories": [
    {
      "id": "events",
      "label": "events",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "family-reunion",
      "label": "family-reunion",
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
      "id": "events_family_reunion_checklist-events-1",
      "name": "events primary",
      "category": "events",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-family-reunion-3",
      "name": "family-reunion primary",
      "category": "family-reunion",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-events-5",
      "name": "events backup",
      "category": "events",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-family-reunion-7",
      "name": "family-reunion backup",
      "category": "family-reunion",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
      "id": "events_family_reunion_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "family",
        "reunion"
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
