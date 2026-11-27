import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "toolbox-talk-audit-mcp",
  "title": "toolbox talk audit Audit",
  "description": "Real local JSON analysis of toolbox talk audit in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_toolbox_talk_audit",
  "entity": "toolbox talk audit item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
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
      "id": "build_toolbox_talk_audit-build-1",
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
      "id": "build_toolbox_talk_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
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
      "id": "build_toolbox_talk_audit-toolbox-talk-3",
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
      "id": "build_toolbox_talk_audit-mcp-4",
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
      "id": "build_toolbox_talk_audit-build-5",
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
      "id": "build_toolbox_talk_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
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
      "id": "build_toolbox_talk_audit-toolbox-talk-7",
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
      "id": "build_toolbox_talk_audit-mcp-8",
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
