import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "houston-astros-outing-match-mcp",
  "title": "Astros Outing Matcher",
  "description": "Real local JSON analysis of astros outing in the Houston lane. 25 MCP tools, no paywall.",
  "prefix": "houston_houston_astros_outing_match",
  "entity": "astros outing item",
  "categories": [
    {
      "id": "criteria",
      "label": "Criteria",
      "baseline": 2
    },
    {
      "id": "candidates",
      "label": "Candidates",
      "baseline": 2
    },
    {
      "id": "scores",
      "label": "Scores",
      "baseline": 2
    },
    {
      "id": "shortlist",
      "label": "Shortlist",
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
        "criteria"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shortlist"
      ]
    }
  ],
  "sample": [
    {
      "id": "houston_houston_astros_outing_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "houston",
        "houston",
        "astros"
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
      "id": "houston_houston_astros_outing_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "houston",
        "houston",
        "astros"
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
