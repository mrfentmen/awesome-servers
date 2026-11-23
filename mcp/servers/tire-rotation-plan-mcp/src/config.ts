import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tire-rotation-plan-mcp",
  "title": "Tire Rotation Plan Guide",
  "description": "Real local JSON analysis of tire rotation plan in the Brake Pad lane. 25 MCP tools, no paywall.",
  "prefix": "brake_pad_tire_rotation_plan",
  "entity": "tire rotation plan item",
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
      "id": "brake_pad_tire_rotation_plan-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
      "id": "brake_pad_tire_rotation_plan-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "brake-pad",
        "tire",
        "rotation"
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
