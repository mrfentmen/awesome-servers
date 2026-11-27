import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "shift-handoff-guide-mcp",
  "title": "shift handoff guide Guide",
  "description": "Real local JSON analysis of shift handoff guide in the Health & Care Work lane. 25 MCP tools, no paywall.",
  "prefix": "care_shift_handoff_guide",
  "entity": "shift handoff guide item",
  "categories": [
    {
      "id": "care",
      "label": "care",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "shift-handoff",
      "label": "shift-handoff",
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
        "care"
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
      "id": "care_shift_handoff_guide-care-1",
      "name": "care primary",
      "category": "care",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-shift-handoff-3",
      "name": "shift-handoff primary",
      "category": "shift-handoff",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-care-5",
      "name": "care backup",
      "category": "care",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-shift-handoff-7",
      "name": "shift-handoff backup",
      "category": "shift-handoff",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
      "id": "care_shift_handoff_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "shift",
        "handoff"
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
