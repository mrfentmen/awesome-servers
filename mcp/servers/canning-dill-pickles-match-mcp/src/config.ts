import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "canning-dill-pickles-match-mcp",
  "title": "Dill Pickles Matcher",
  "description": "Real local JSON analysis of dill pickles in the Canning and Preserving lane. 25 MCP tools, no paywall.",
  "prefix": "canning_canning_dill_pickles_match",
  "entity": "dill pickles item",
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
      "id": "canning_canning_dill_pickles_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
      "id": "canning_canning_dill_pickles_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "canning-and-preserving",
        "canning",
        "dill"
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
