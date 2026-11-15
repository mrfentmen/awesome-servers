import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-rent-commute-match-mcp",
  "title": "Rent Commute Match Audit",
  "description": "Match rent commute by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rent_commute_match",
  "entity": "commute option match",
  "categories": [
    {
      "id": "rent",
      "label": "Rent",
      "baseline": 2
    },
    {
      "id": "commute",
      "label": "Commute",
      "baseline": 1
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "baseline": 1
    },
    {
      "id": "pass",
      "label": "Pass",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "commute_minutes",
    "label": "Commute minutes",
    "unit": "min",
    "target": 45,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 3400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "rent",
      "label": "Rent",
      "categories": [
        "rent"
      ]
    },
    {
      "id": "commute",
      "label": "Commute",
      "categories": [
        "commute"
      ]
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "categories": [
        "transfers"
      ]
    },
    {
      "id": "pass",
      "label": "Pass",
      "categories": [
        "pass"
      ]
    }
  ],
  "sample": [
    {
      "id": "rent_commute_match-apartment-a-rent",
      "name": "Apartment A rent",
      "category": "rent",
      "tags": [
        "rent"
      ],
      "cost": 0,
      "quantity": 2400,
      "condition": "good"
    },
    {
      "id": "rent_commute_match-door-to-door-commute",
      "name": "Door-to-door commute",
      "category": "commute",
      "tags": [
        "commute"
      ],
      "cost": 0,
      "quantity": 38,
      "condition": "good"
    },
    {
      "id": "rent_commute_match-transfer-count",
      "name": "Transfer count",
      "category": "transfers",
      "tags": [
        "transfers"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "rent_commute_match-monthly-pass",
      "name": "Monthly pass",
      "category": "pass",
      "tags": [
        "pass"
      ],
      "cost": 132,
      "quantity": 132,
      "condition": "new"
    }
  ]
}
