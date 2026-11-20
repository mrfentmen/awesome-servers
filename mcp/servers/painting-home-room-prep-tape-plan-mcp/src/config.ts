import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "painting-home-room-prep-tape-plan-mcp",
  "title": "Room Prep Tape Planner",
  "description": "Real local JSON analysis of room prep tape in the Home Painting lane. 25 MCP tools, no paywall.",
  "prefix": "painting_home_painting_home_room_prep_tape_plan",
  "entity": "room prep tape item",
  "categories": [
    {
      "id": "goals",
      "label": "Goals",
      "baseline": 2
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "baseline": 2
    },
    {
      "id": "budget",
      "label": "Budget",
      "baseline": 2
    },
    {
      "id": "dependencies",
      "label": "Dependencies",
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
        "goals"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "dependencies"
      ]
    }
  ],
  "sample": [
    {
      "id": "painting_home_painting_home_room_prep_tape_plan-goals-1",
      "name": "Goals primary",
      "category": "goals",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-schedule-2",
      "name": "Schedule primary",
      "category": "schedule",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-budget-3",
      "name": "Budget primary",
      "category": "budget",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-dependencies-4",
      "name": "Dependencies primary",
      "category": "dependencies",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-goals-5",
      "name": "Goals backup",
      "category": "goals",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-schedule-6",
      "name": "Schedule backup",
      "category": "schedule",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-budget-7",
      "name": "Budget backup",
      "category": "budget",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
      "id": "painting_home_painting_home_room_prep_tape_plan-dependencies-8",
      "name": "Dependencies backup",
      "category": "dependencies",
      "tags": [
        "home-painting",
        "painting",
        "home"
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
