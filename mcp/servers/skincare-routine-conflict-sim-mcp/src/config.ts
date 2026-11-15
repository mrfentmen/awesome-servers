import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-routine-conflict-sim-mcp",
  "title": "Routine Conflict Simulator",
  "description": "Simulate routine conflict by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "routine_conflict_sim",
  "entity": "skincare product simulation",
  "categories": [
    {
      "id": "cleanser",
      "label": "Cleansers",
      "baseline": 1
    },
    {
      "id": "active",
      "label": "Actives",
      "baseline": 2
    },
    {
      "id": "moisturizer",
      "label": "Moisturizers",
      "baseline": 1
    },
    {
      "id": "spf",
      "label": "SPF",
      "baseline": 1
    },
    {
      "id": "treatment",
      "label": "Treatments",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "conflict_count",
    "label": "Ingredient conflicts",
    "unit": "conflicts",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 12,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 180
  },
  "dependencies": [
    {
      "id": "cleanse",
      "label": "Cleansing step",
      "categories": [
        "cleanser"
      ]
    },
    {
      "id": "active",
      "label": "Active treatment",
      "categories": [
        "active"
      ]
    },
    {
      "id": "moisturize",
      "label": "Moisturizing step",
      "categories": [
        "moisturizer"
      ]
    },
    {
      "id": "protect",
      "label": "Sun protection",
      "categories": [
        "spf"
      ]
    }
  ],
  "sample": [
    {
      "id": "routine_conflict_sim-cleanser",
      "name": "Gel cleanser",
      "category": "cleanser",
      "tags": [
        "gentle",
        "daily"
      ],
      "cost": 22,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "routine_conflict_sim-retinol",
      "name": "Retinol serum",
      "category": "active",
      "tags": [
        "retinol",
        "night"
      ],
      "cost": 38,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "routine_conflict_sim-vitamin-c",
      "name": "Vitamin C serum",
      "category": "active",
      "tags": [
        "vitamin-c",
        "morning"
      ],
      "cost": 35,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "routine_conflict_sim-moisturizer",
      "name": "Barrier moisturizer",
      "category": "moisturizer",
      "tags": [
        "ceramide",
        "daily"
      ],
      "cost": 28,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "routine_conflict_sim-spf",
      "name": "SPF 50",
      "category": "spf",
      "tags": [
        "mineral",
        "daily"
      ],
      "cost": 30,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "routine_conflict_sim-bha",
      "name": "BHA toner",
      "category": "treatment",
      "tags": [
        "salicylic",
        "night"
      ],
      "cost": 26,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
