import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "swim-team-checklist-mcp",
  "title": "swim team checklist Checklist",
  "description": "Real local JSON analysis of swim team checklist in the Youth & Amateur Sports lane. 25 MCP tools, no paywall.",
  "prefix": "youthsports_swim_team_checklist",
  "entity": "swim team checklist item",
  "categories": [
    {
      "id": "youthsports",
      "label": "youthsports",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "swim-team",
      "label": "swim-team",
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
        "youthsports"
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
      "id": "youthsports_swim_team_checklist-youthsports-1",
      "name": "youthsports primary",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-swim-team-3",
      "name": "swim-team primary",
      "category": "swim-team",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-youthsports-5",
      "name": "youthsports backup",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-swim-team-7",
      "name": "swim-team backup",
      "category": "swim-team",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
      "id": "youthsports_swim_team_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "swim",
        "team"
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
