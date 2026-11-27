import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lead-score-tracker-mcp",
  "title": "lead score tracker Tracker",
  "description": "Real local JSON analysis of lead score tracker in the Marketing & Sales lane. 25 MCP tools, no paywall.",
  "prefix": "mkt_lead_score_tracker",
  "entity": "lead score tracker item",
  "categories": [
    {
      "id": "mkt",
      "label": "mkt",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "lead-score",
      "label": "lead-score",
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
    "label": "Days since activity",
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
        "mkt"
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
      "id": "mkt_lead_score_tracker-mkt-1",
      "name": "mkt primary",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-lead-score-3",
      "name": "lead-score primary",
      "category": "lead-score",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-mkt-5",
      "name": "mkt backup",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-lead-score-7",
      "name": "lead-score backup",
      "category": "lead-score",
      "tags": [
        "marketing-sales",
        "lead",
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
      "id": "mkt_lead_score_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "lead",
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
