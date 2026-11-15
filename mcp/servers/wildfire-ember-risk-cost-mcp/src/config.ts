import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-ember-risk-cost-mcp",
  "title": "Ember Risk Budget Audit",
  "description": "Audit ember risk budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ember_risk_budget",
  "entity": "ember risk item budget line",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "vents",
      "label": "Vents",
      "baseline": 1
    },
    {
      "id": "deck",
      "label": "Deck",
      "baseline": 1
    },
    {
      "id": "gutters",
      "label": "Gutters",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 450,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "roof",
      "label": "Roof",
      "categories": [
        "roof"
      ]
    },
    {
      "id": "vents",
      "label": "Vents",
      "categories": [
        "vents"
      ]
    },
    {
      "id": "deck",
      "label": "Deck",
      "categories": [
        "deck"
      ]
    },
    {
      "id": "gutters",
      "label": "Gutters",
      "categories": [
        "gutters"
      ]
    }
  ],
  "sample": [
    {
      "id": "ember_risk_budget-roof-inspection",
      "name": "Roof inspection",
      "category": "roof",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "ember_risk_budget-vent-screens",
      "name": "Vent screens",
      "category": "vents",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "ember_risk_budget-deck-board-repair",
      "name": "Deck board repair",
      "category": "deck",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "new"
    },
    {
      "id": "ember_risk_budget-gutter-guards",
      "name": "Gutter guards",
      "category": "gutters",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    }
  ]
}
