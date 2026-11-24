import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "turntable-speed-check-mcp",
  "title": "Turntable Speed Check Guide",
  "description": "Real local JSON analysis of turntable speed check in the Listening Room lane. 25 MCP tools, no paywall.",
  "prefix": "listening_room_turntable_speed_check",
  "entity": "turntable speed check item",
  "categories": [
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    },
    {
      "id": "parts",
      "label": "Parts",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
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
        "steps"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "listening_room_turntable_speed_check-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
      "id": "listening_room_turntable_speed_check-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "listening-room",
        "turntable",
        "speed"
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
