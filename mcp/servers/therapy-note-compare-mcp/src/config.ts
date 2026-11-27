import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "therapy-note-compare-mcp",
  "title": "therapy note compare Compare",
  "description": "Real local JSON analysis of therapy note compare in the Health & Care Work lane. 25 MCP tools, no paywall.",
  "prefix": "care_therapy_note_compare",
  "entity": "therapy note compare item",
  "categories": [
    {
      "id": "care",
      "label": "care",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "therapy-note",
      "label": "therapy-note",
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
      "id": "care_therapy_note_compare-care-1",
      "name": "care primary",
      "category": "care",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-therapy-note-3",
      "name": "therapy-note primary",
      "category": "therapy-note",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-care-5",
      "name": "care backup",
      "category": "care",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-therapy-note-7",
      "name": "therapy-note backup",
      "category": "therapy-note",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
      "id": "care_therapy_note_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "therapy",
        "note"
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
