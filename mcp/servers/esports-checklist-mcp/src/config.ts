import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "esports-checklist-mcp",
  "title": "esports checklist Checklist",
  "description": "Real local JSON analysis of esports checklist in the Entertainment & Gaming lane. 25 MCP tools, no paywall.",
  "prefix": "entertainment_esports_checklist",
  "entity": "esports checklist item",
  "categories": [
    {
      "id": "entertainment",
      "label": "entertainment",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "esports",
      "label": "esports",
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
        "entertainment"
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
      "id": "entertainment_esports_checklist-entertainment-1",
      "name": "entertainment primary",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-esports-3",
      "name": "esports primary",
      "category": "esports",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-entertainment-5",
      "name": "entertainment backup",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-esports-7",
      "name": "esports backup",
      "category": "esports",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
      "id": "entertainment_esports_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "esports",
        "checklist"
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
