import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-freeze-pipes-cost-mcp",
  "title": "Freeze Pipes Budget Audit",
  "description": "Audit freeze pipes budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "freeze_pipes_budget",
  "entity": "pipe protection item budget line",
  "categories": [
    {
      "id": "insulation",
      "label": "Insulation",
      "baseline": 2
    },
    {
      "id": "heat",
      "label": "Heat",
      "baseline": 1
    },
    {
      "id": "shutoff",
      "label": "Shutoff",
      "baseline": 1
    },
    {
      "id": "drain",
      "label": "Drain",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "insulation",
      "label": "Insulation",
      "categories": [
        "insulation"
      ]
    },
    {
      "id": "heat",
      "label": "Heat",
      "categories": [
        "heat"
      ]
    },
    {
      "id": "shutoff",
      "label": "Shutoff",
      "categories": [
        "shutoff"
      ]
    },
    {
      "id": "drain",
      "label": "Drain",
      "categories": [
        "drain"
      ]
    }
  ],
  "sample": [
    {
      "id": "freeze_pipes_budget-pipe-insulation",
      "name": "Pipe insulation",
      "category": "insulation",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "freeze_pipes_budget-heat-tape",
      "name": "Heat tape",
      "category": "heat",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "freeze_pipes_budget-shutoff-valve",
      "name": "Shutoff valve",
      "category": "shutoff",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "freeze_pipes_budget-drain-valve",
      "name": "Drain valve",
      "category": "drain",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    }
  ]
}
