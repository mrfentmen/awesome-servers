import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "coffee-bean-subscription-match-mcp",
  "title": "Bean Subscription Matcher",
  "description": "Real local JSON analysis of bean subscription in the Coffee lane. 25 MCP tools, no paywall.",
  "prefix": "coffee_coffee_bean_subscription_match",
  "entity": "bean subscription item",
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
      "id": "coffee_coffee_bean_subscription_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
