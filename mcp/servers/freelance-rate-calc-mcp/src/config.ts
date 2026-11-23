import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "freelance-rate-calc-mcp",
  "title": "Freelance Rate Calc Audit",
  "description": "Real local JSON analysis of freelance rate calc in the Career Ladder lane. 25 MCP tools, no paywall.",
  "prefix": "career_ladder_freelance_rate_calc",
  "entity": "freelance rate calc item",
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
      "id": "career_ladder_freelance_rate_calc-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
      "id": "career_ladder_freelance_rate_calc-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "career-ladder",
        "freelance",
        "rate"
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
