import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "orthodontics-checklist-mcp",
  "title": "orthodontics checklist Checklist",
  "description": "Real local JSON analysis of orthodontics checklist in the Health & Wellness lane. 25 MCP tools, no paywall.",
  "prefix": "health_orthodontics_checklist",
  "entity": "orthodontics checklist item",
  "categories": [
    {
      "id": "health",
      "label": "health",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "orthodontics",
      "label": "orthodontics",
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
        "health"
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
      "id": "health_orthodontics_checklist-health-1",
      "name": "health primary",
      "category": "health",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-orthodontics-3",
      "name": "orthodontics primary",
      "category": "orthodontics",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-health-5",
      "name": "health backup",
      "category": "health",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-orthodontics-7",
      "name": "orthodontics backup",
      "category": "orthodontics",
      "tags": [
        "health-wellness",
        "orthodontics",
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
      "id": "health_orthodontics_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "orthodontics",
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
