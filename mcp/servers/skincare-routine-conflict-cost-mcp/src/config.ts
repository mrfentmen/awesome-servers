import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-routine-conflict-cost-mcp",
  "title": "Routine Conflict Budget Audit",
  "description": "Audit routine conflict budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "routine_conflict_budget",
  "entity": "skincare product budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
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
      "id": "routine_conflict_budget-gel-cleanser",
      "name": "Gel cleanser",
      "category": "cleanser",
      "tags": [
        "budget"
      ],
      "cost": 22,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "routine_conflict_budget-retinol-serum",
      "name": "Retinol serum",
      "category": "active",
      "tags": [
        "budget"
      ],
      "cost": 38,
      "quantity": 38,
      "condition": "good"
    },
    {
      "id": "routine_conflict_budget-vitamin-c-serum",
      "name": "Vitamin C serum",
      "category": "active",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "routine_conflict_budget-barrier-moisturizer",
      "name": "Barrier moisturizer",
      "category": "moisturizer",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "routine_conflict_budget-spf-50",
      "name": "SPF 50",
      "category": "spf",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "routine_conflict_budget-bha-toner",
      "name": "BHA toner",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 26,
      "quantity": 26,
      "condition": "good"
    }
  ]
}
