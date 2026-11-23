import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "anthem-claim-tracker-mcp",
  "title": "Anthem Claim Tracker Tracker",
  "description": "Real local JSON analysis of anthem claim tracker in the Anthem Claim lane. 25 MCP tools, no paywall.",
  "prefix": "anthem_claim_anthem_claim_tracker",
  "entity": "anthem claim tracker item",
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
      "id": "anthem_claim_anthem_claim_tracker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
      "id": "anthem_claim_anthem_claim_tracker-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "anthem-claim",
        "anthem",
        "claim"
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
