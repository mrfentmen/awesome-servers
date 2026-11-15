import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-driveway-clear-cost-mcp",
  "title": "Driveway Clearing Budget Audit",
  "description": "Audit driveway clearing budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "driveway_clear_budget",
  "entity": "driveway item budget line",
  "categories": [
    {
      "id": "driveway",
      "label": "Driveway",
      "baseline": 2
    },
    {
      "id": "walkway",
      "label": "Walkway",
      "baseline": 1
    },
    {
      "id": "equipment",
      "label": "Equipment",
      "baseline": 1
    },
    {
      "id": "deicer",
      "label": "Deicer",
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
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "driveway",
      "label": "Driveway",
      "categories": [
        "driveway"
      ]
    },
    {
      "id": "walkway",
      "label": "Walkway",
      "categories": [
        "walkway"
      ]
    },
    {
      "id": "equipment",
      "label": "Equipment",
      "categories": [
        "equipment"
      ]
    },
    {
      "id": "deicer",
      "label": "Deicer",
      "categories": [
        "deicer"
      ]
    }
  ],
  "sample": [
    {
      "id": "driveway_clear_budget-driveway-plow",
      "name": "Driveway plow",
      "category": "driveway",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "driveway_clear_budget-walkway-shovel",
      "name": "Walkway shovel",
      "category": "walkway",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "driveway_clear_budget-snow-blower-service",
      "name": "Snow blower service",
      "category": "equipment",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "driveway_clear_budget-ice-melt",
      "name": "Ice melt",
      "category": "deicer",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    }
  ]
}
