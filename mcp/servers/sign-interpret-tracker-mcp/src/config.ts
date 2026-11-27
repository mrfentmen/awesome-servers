import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sign-interpret-tracker-mcp",
  "title": "sign interpret tracker Tracker",
  "description": "Real local JSON analysis of sign interpret tracker in the Accessibility & Disability lane. 25 MCP tools, no paywall.",
  "prefix": "access_sign_interpret_tracker",
  "entity": "sign interpret tracker item",
  "categories": [
    {
      "id": "access",
      "label": "access",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "sign-interpret",
      "label": "sign-interpret",
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
    "label": "Days since activity",
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
        "access"
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
      "id": "access_sign_interpret_tracker-access-1",
      "name": "access primary",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-sign-interpret-3",
      "name": "sign-interpret primary",
      "category": "sign-interpret",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-access-5",
      "name": "access backup",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-sign-interpret-7",
      "name": "sign-interpret backup",
      "category": "sign-interpret",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
