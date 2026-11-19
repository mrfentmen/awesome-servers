import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "denver-ski-day-trip-match-mcp",
  "title": "Ski Day Trip Matcher",
  "description": "Real local JSON analysis of ski day trip in the Denver lane. 25 MCP tools, no paywall.",
  "prefix": "denver_denver_ski_day_trip_match",
  "entity": "ski day trip item",
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
      "id": "denver_denver_ski_day_trip_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "denver",
        "denver",
        "ski"
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
      "id": "denver_denver_ski_day_trip_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "denver",
        "denver",
        "ski"
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
