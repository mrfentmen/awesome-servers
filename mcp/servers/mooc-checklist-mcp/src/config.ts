import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "mooc-checklist-mcp",
  "title": "mooc checklist Checklist",
  "description": "Real local JSON analysis of mooc checklist in the Tutoring & Online Learning lane. 25 MCP tools, no paywall.",
  "prefix": "edtech_mooc_checklist",
  "entity": "mooc checklist item",
  "categories": [
    {
      "id": "edtech",
      "label": "edtech",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "mooc",
      "label": "mooc",
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
      "id": "edtech_mooc_checklist-edtech-1",
      "name": "edtech primary",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-mooc-3",
      "name": "mooc primary",
      "category": "mooc",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-edtech-5",
      "name": "edtech backup",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-mooc-7",
      "name": "mooc backup",
      "category": "mooc",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
      "id": "edtech_mooc_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "mooc",
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
