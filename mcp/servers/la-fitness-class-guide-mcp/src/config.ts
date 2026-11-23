import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-fitness-class-guide-mcp",
  "title": "La Fitness Class Planner",
  "description": "Real local JSON analysis of la fitness class in the La Fitness lane. 25 MCP tools, no paywall.",
  "prefix": "la_fitness_la_fitness_class_guide",
  "entity": "la fitness class item",
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
      "id": "la_fitness_la_fitness_class_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
      "id": "la_fitness_la_fitness_class_guide-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "la-fitness",
        "la",
        "fitness"
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
