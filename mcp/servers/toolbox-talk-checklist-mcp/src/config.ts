import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "toolbox-talk-checklist-mcp",
  "title": "toolbox talk checklist Checklist",
  "description": "Real local JSON analysis of toolbox talk checklist in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_toolbox_talk_checklist",
  "entity": "toolbox talk checklist item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "toolbox-talk",
      "label": "toolbox-talk",
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
        "build"
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
      "id": "build_toolbox_talk_checklist-build-1",
      "name": "build primary",
      "category": "build",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-toolbox-talk-3",
      "name": "toolbox-talk primary",
      "category": "toolbox-talk",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-build-5",
      "name": "build backup",
      "category": "build",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-toolbox-talk-7",
      "name": "toolbox-talk backup",
      "category": "toolbox-talk",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
      "id": "build_toolbox_talk_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "build-factory",
        "toolbox",
        "talk"
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
