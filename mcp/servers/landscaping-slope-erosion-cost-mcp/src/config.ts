import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-slope-erosion-cost-mcp",
  "title": "Slope Erosion Budget Audit",
  "description": "Audit slope erosion budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "slope_erosion_budget",
  "entity": "slope treatment budget line",
  "categories": [
    {
      "id": "groundcover",
      "label": "Groundcover",
      "baseline": 2
    },
    {
      "id": "terrace",
      "label": "Terraces",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "retaining",
      "label": "Retaining walls",
      "baseline": 1
    },
    {
      "id": "mulch",
      "label": "Mulch",
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
    "budget": 2350,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "cover",
      "label": "Ground cover",
      "categories": [
        "groundcover",
        "mulch"
      ]
    },
    {
      "id": "structure",
      "label": "Slope structure",
      "categories": [
        "terrace",
        "retaining"
      ]
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    }
  ],
  "sample": [
    {
      "id": "slope_erosion_budget-creeping-thyme",
      "name": "Creeping thyme",
      "category": "groundcover",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "slope_erosion_budget-erosion-blanket",
      "name": "Erosion blanket",
      "category": "groundcover",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "slope_erosion_budget-timber-terrace",
      "name": "Timber terrace",
      "category": "terrace",
      "tags": [
        "budget"
      ],
      "cost": 450,
      "quantity": 450,
      "condition": "good"
    },
    {
      "id": "slope_erosion_budget-french-drain",
      "name": "French drain",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 320,
      "quantity": 320,
      "condition": "good"
    },
    {
      "id": "slope_erosion_budget-retaining-wall",
      "name": "Retaining wall",
      "category": "retaining",
      "tags": [
        "budget"
      ],
      "cost": 900,
      "quantity": 900,
      "condition": "good"
    },
    {
      "id": "slope_erosion_budget-bark-mulch",
      "name": "Bark mulch",
      "category": "mulch",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    }
  ]
}
