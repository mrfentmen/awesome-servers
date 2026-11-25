import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "physical-therapy-compare-mcp",
  "title": "physical-therapy compare Compare",
  "description": "Real local JSON analysis of physical-therapy compare in the Health & Wellness lane. 25 MCP tools, no paywall.",
  "prefix": "health_physical_therapy_compare",
  "entity": "physical-therapy compare item",
  "categories": [
    {
      "id": "health",
      "label": "health",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "physical-therapy",
      "label": "physical-therapy",
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
        "health"
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
      "id": "health_physical_therapy_compare-health-1",
      "name": "health primary",
      "category": "health",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-physical-therapy-3",
      "name": "physical-therapy primary",
      "category": "physical-therapy",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-health-5",
      "name": "health backup",
      "category": "health",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-physical-therapy-7",
      "name": "physical-therapy backup",
      "category": "physical-therapy",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
      "id": "health_physical_therapy_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "physical",
        "therapy"
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
