import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "pet-sitter-interview-mcp",
  "title": "Pet Sitter Interview Planner",
  "description": "Real local JSON analysis of pet sitter interview in the Puppy Care lane. 25 MCP tools, no paywall.",
  "prefix": "puppy_care_pet_sitter_interview",
  "entity": "pet sitter interview item",
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
      "id": "puppy_care_pet_sitter_interview-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
      "id": "puppy_care_pet_sitter_interview-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "puppy-care",
        "pet",
        "sitter"
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
