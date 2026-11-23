import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "power-steering-fluid-guide-mcp",
  "title": "Power Steering Fluid Guide Tracker",
  "description": "Real local JSON analysis of power steering fluid guide in the Brake Pad lane. 25 MCP tools, no paywall.",
  "prefix": "brake_pad_power_steering_fluid_guide",
  "entity": "power steering fluid guide item",
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
      "id": "brake_pad_power_steering_fluid_guide-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
      "id": "brake_pad_power_steering_fluid_guide-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "brake-pad",
        "power",
        "steering"
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
