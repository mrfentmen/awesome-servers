import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "donut-fry-temp-mcp",
  "title": "Donut Fry Temp Tracker",
  "description": "Real local JSON analysis of donut fry temp in the Bake Lab lane. 25 MCP tools, no paywall.",
  "prefix": "bake_lab_donut_fry_temp",
  "entity": "donut fry temp item",
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
      "id": "bake_lab_donut_fry_temp-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
      "id": "bake_lab_donut_fry_temp-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "bake-lab",
        "donut",
        "fry"
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
