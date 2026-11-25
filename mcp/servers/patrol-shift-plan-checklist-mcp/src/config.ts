import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "patrol-shift-plan-checklist-mcp",
  "title": "Patrol Shift Plan Checklist Checklist",
  "description": "Real local JSON analysis of patrol shift plan checklist in the Police lane. 25 MCP tools, no paywall.",
  "prefix": "police_patrol_shift_plan_checklist",
  "entity": "patrol shift plan checklist item",
  "categories": [
    {
      "id": "items",
      "label": "Items",
      "baseline": 2
    },
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "checks",
      "label": "Checks",
      "baseline": 2
    },
    {
      "id": "ready",
      "label": "Ready",
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
        "items"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "ready"
      ]
    }
  ],
  "sample": [
    {
      "id": "police_patrol_shift_plan_checklist-items-1",
      "name": "Items primary",
      "category": "items",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-steps-2",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-checks-3",
      "name": "Checks primary",
      "category": "checks",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-ready-4",
      "name": "Ready primary",
      "category": "ready",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-items-5",
      "name": "Items backup",
      "category": "items",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-steps-6",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-checks-7",
      "name": "Checks backup",
      "category": "checks",
      "tags": [
        "police",
        "patrol",
        "shift"
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
      "id": "police_patrol_shift_plan_checklist-ready-8",
      "name": "Ready backup",
      "category": "ready",
      "tags": [
        "police",
        "patrol",
        "shift"
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
