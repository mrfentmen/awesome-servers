import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "aquarium-cycle-tracker-mcp",
  "title": "Aquarium Cycle Tracker Compare",
  "description": "Real local JSON analysis of aquarium cycle tracker in the Puppy Care lane. 25 MCP tools, no paywall.",
  "prefix": "puppy_care_aquarium_cycle_tracker",
  "entity": "aquarium cycle tracker item",
  "categories": [
    {
      "id": "rows",
      "label": "Rows",
      "baseline": 2
    },
    {
      "id": "flags",
      "label": "Flags",
      "baseline": 2
    },
    {
      "id": "totals",
      "label": "Totals",
      "baseline": 2
    },
    {
      "id": "notes",
      "label": "Notes",
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
        "rows"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "notes"
      ]
    }
  ],
  "sample": [
    {
      "id": "puppy_care_aquarium_cycle_tracker-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-totals-3",
      "name": "Totals primary",
      "category": "totals",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-notes-4",
      "name": "Notes primary",
      "category": "notes",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-rows-5",
      "name": "Rows backup",
      "category": "rows",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-flags-6",
      "name": "Flags backup",
      "category": "flags",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-totals-7",
      "name": "Totals backup",
      "category": "totals",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
      "id": "puppy_care_aquarium_cycle_tracker-notes-8",
      "name": "Notes backup",
      "category": "notes",
      "tags": [
        "puppy-care",
        "aquarium",
        "cycle"
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
