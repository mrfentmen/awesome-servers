import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "raised-bed-soil-mix-mcp",
  "title": "Raised Bed Soil Mix Checklist",
  "description": "Real local JSON analysis of raised bed soil mix in the Garden Beds lane. 25 MCP tools, no paywall.",
  "prefix": "garden_beds_raised_bed_soil_mix",
  "entity": "raised bed soil mix item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "garden_beds_raised_bed_soil_mix-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
      "id": "garden_beds_raised_bed_soil_mix-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "garden-beds",
        "raised",
        "bed"
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
