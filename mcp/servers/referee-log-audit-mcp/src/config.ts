import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "referee-log-audit-mcp",
  "title": "referee log audit Audit",
  "description": "Real local JSON analysis of referee log audit in the Sports Coaching lane. 25 MCP tools, no paywall.",
  "prefix": "coach_referee_log_audit",
  "entity": "referee log audit item",
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
      "id": "referee-log",
      "label": "referee-log",
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
      "id": "coach_referee_log_audit-coach-1",
      "name": "coach primary",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-referee-log-3",
      "name": "referee-log primary",
      "category": "referee-log",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-coach-5",
      "name": "coach backup",
      "category": "coach",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-referee-log-7",
      "name": "referee-log backup",
      "category": "referee-log",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
      "id": "coach_referee_log_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "sports-coaching",
        "referee",
        "log"
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
