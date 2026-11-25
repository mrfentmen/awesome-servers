import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "certification-planner-mcp",
  "title": "certification planner Planner",
  "description": "Real local JSON analysis of certification planner in the Tutoring & Online Learning lane. 25 MCP tools, no paywall.",
  "prefix": "edtech_certification_planner",
  "entity": "certification planner item",
  "categories": [
    {
      "id": "edtech",
      "label": "edtech",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "certification",
      "label": "certification",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
      "id": "edtech_certification_planner-edtech-1",
      "name": "edtech primary",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-certification-3",
      "name": "certification primary",
      "category": "certification",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-edtech-5",
      "name": "edtech backup",
      "category": "edtech",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-certification-7",
      "name": "certification backup",
      "category": "certification",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
      "id": "edtech_certification_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "tutoring-online-learning",
        "certification",
        "planner"
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
