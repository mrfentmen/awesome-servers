import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "mlb-score-tracker-mcp",
  "title": "Mlb Score Tracker Matcher",
  "description": "Real local JSON analysis of mlb score tracker in the Mlb Score lane. 25 MCP tools, no paywall.",
  "prefix": "mlb_score_mlb_score_tracker",
  "entity": "mlb score tracker item",
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
    "id": "clearance_risk",
    "label": "Claim risk",
    "unit": "score",
    "target": 0,
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
      "id": "mlb_score_mlb_score_tracker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
      "id": "mlb_score_mlb_score_tracker-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "mlb-score",
        "mlb",
        "score"
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
