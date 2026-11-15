import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-smoke-shelter-cost-mcp",
  "title": "Smoke Shelter Budget Audit",
  "description": "Audit smoke shelter budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "smoke_shelter_budget",
  "entity": "shelter item budget line",
  "categories": [
    {
      "id": "room",
      "label": "Room",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "seal",
      "label": "Seal",
      "baseline": 1
    },
    {
      "id": "monitor",
      "label": "Monitor",
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
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "room",
      "label": "Room",
      "categories": [
        "room"
      ]
    },
    {
      "id": "filter",
      "label": "Filter",
      "categories": [
        "filter"
      ]
    },
    {
      "id": "seal",
      "label": "Seal",
      "categories": [
        "seal"
      ]
    },
    {
      "id": "monitor",
      "label": "Monitor",
      "categories": [
        "monitor"
      ]
    }
  ],
  "sample": [
    {
      "id": "smoke_shelter_budget-clean-room-setup",
      "name": "Clean room setup",
      "category": "room",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "smoke_shelter_budget-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "smoke_shelter_budget-door-seal",
      "name": "Door seal",
      "category": "seal",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "smoke_shelter_budget-air-monitor",
      "name": "Air monitor",
      "category": "monitor",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    }
  ]
}
