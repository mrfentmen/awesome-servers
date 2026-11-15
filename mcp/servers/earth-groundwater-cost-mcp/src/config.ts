import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-groundwater-cost-mcp",
  "title": "Groundwater Budget Audit",
  "description": "Audit groundwater budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "groundwater_budget",
  "entity": "groundwater reading budget line",
  "categories": [
    {
      "id": "well",
      "label": "Well",
      "baseline": 2
    },
    {
      "id": "level",
      "label": "Level",
      "baseline": 1
    },
    {
      "id": "quality",
      "label": "Quality",
      "baseline": 1
    },
    {
      "id": "use",
      "label": "Use",
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
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "well",
      "label": "Well",
      "categories": [
        "well"
      ]
    },
    {
      "id": "level",
      "label": "Level",
      "categories": [
        "level"
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "categories": [
        "quality"
      ]
    },
    {
      "id": "use",
      "label": "Use",
      "categories": [
        "use"
      ]
    }
  ],
  "sample": [
    {
      "id": "groundwater_budget-well-inspection",
      "name": "Well inspection",
      "category": "well",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "groundwater_budget-level-logger",
      "name": "Level logger",
      "category": "level",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "new"
    },
    {
      "id": "groundwater_budget-lab-water-test",
      "name": "Lab water test",
      "category": "quality",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "groundwater_budget-use-audit",
      "name": "Use audit",
      "category": "use",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
