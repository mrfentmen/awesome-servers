import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "massage-therapy-guide-mcp",
  "title": "massage-therapy guide Guide",
  "description": "Real local JSON analysis of massage-therapy guide in the Health & Wellness lane. 25 MCP tools, no paywall.",
  "prefix": "health_massage_therapy_guide",
  "entity": "massage-therapy guide item",
  "categories": [
    {
      "id": "health",
      "label": "health",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "massage-therapy",
      "label": "massage-therapy",
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
      "id": "health_massage_therapy_guide-health-1",
      "name": "health primary",
      "category": "health",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-massage-therapy-3",
      "name": "massage-therapy primary",
      "category": "massage-therapy",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-health-5",
      "name": "health backup",
      "category": "health",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-massage-therapy-7",
      "name": "massage-therapy backup",
      "category": "massage-therapy",
      "tags": [
        "health-wellness",
        "massage",
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
      "id": "health_massage_therapy_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "massage",
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
