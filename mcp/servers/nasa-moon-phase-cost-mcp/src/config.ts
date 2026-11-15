import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-moon-phase-cost-mcp",
  "title": "Moon Phase Budget Audit",
  "description": "Audit moon phase budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "moon_phase_budget",
  "entity": "moon observation budget line",
  "categories": [
    {
      "id": "phase",
      "label": "Phase",
      "baseline": 2
    },
    {
      "id": "rise",
      "label": "Rise",
      "baseline": 1
    },
    {
      "id": "cloud",
      "label": "Cloud",
      "baseline": 1
    },
    {
      "id": "location",
      "label": "Location",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "phase",
      "label": "Phase",
      "categories": [
        "phase"
      ]
    },
    {
      "id": "rise",
      "label": "Rise",
      "categories": [
        "rise"
      ]
    },
    {
      "id": "cloud",
      "label": "Cloud",
      "categories": [
        "cloud"
      ]
    },
    {
      "id": "location",
      "label": "Location",
      "categories": [
        "location"
      ]
    }
  ],
  "sample": [
    {
      "id": "moon_phase_budget_budget-binoculars",
      "name": "Binoculars",
      "category": "phase",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "moon_phase_budget_budget-tripod",
      "name": "Tripod",
      "category": "rise",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "moon_phase_budget_budget-red-light",
      "name": "Red light",
      "category": "cloud",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "moon_phase_budget_budget-viewing-permit",
      "name": "Viewing permit",
      "category": "location",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
