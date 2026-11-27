import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "scout-visit-audit-mcp",
  "title": "scout visit audit Audit",
  "description": "Real local JSON analysis of scout visit audit in the Sports Coaching lane. 25 MCP tools, no paywall.",
  "prefix": "coach_scout_visit_audit",
  "entity": "scout visit audit item",
  "categories": [
    {
      "id": "coach",
      "label": "coach",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "scout-visit",
      "label": "scout-visit",
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
        "coach"
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
      "id": "coach_scout_visit_audit-coach-1",
      "name": "coach primary",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-scout-visit-3",
      "name": "scout-visit primary",
      "category": "scout-visit",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-coach-5",
      "name": "coach backup",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-scout-visit-7",
      "name": "scout-visit backup",
      "category": "scout-visit",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
      "id": "coach_scout_visit_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "scout",
        "visit"
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
