import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-ember-risk-plan-mcp",
  "title": "Ember Risk Planning Audit",
  "description": "Plan ember risk by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ember_risk_plan",
  "entity": "ember risk item plan",
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
    "id": "ember_vulnerabilities",
    "label": "Ember vulnerabilities",
    "unit": "count",
    "target": 0,
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
      "id": "ember_risk_plan-roof-class",
      "name": "Roof class",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "ember_risk_plan-vent-screens",
      "name": "Vent screens",
      "category": "vents",
      "tags": [
        "vents"
      ],
      "cost": 50,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "ember_risk_plan-deck-boards",
      "name": "Deck boards",
      "category": "deck",
      "tags": [
        "deck"
      ],
      "cost": 200,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "ember_risk_plan-gutter-guards",
      "name": "Gutter guards",
      "category": "gutters",
      "tags": [
        "gutters"
      ],
      "cost": 100,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
