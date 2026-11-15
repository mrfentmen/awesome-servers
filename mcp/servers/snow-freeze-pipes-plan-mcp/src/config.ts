import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-freeze-pipes-plan-mcp",
  "title": "Freeze Pipes Planning Audit",
  "description": "Plan freeze pipes by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "freeze_pipes_plan",
  "entity": "pipe protection item plan",
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
    "id": "insulated_length",
    "label": "Insulated length",
    "unit": "ft",
    "target": 20,
    "direction": "higher"
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
      "id": "freeze_pipes_plan-pipe-insulation",
      "name": "Pipe insulation",
      "category": "insulation",
      "tags": [
        "insulation"
      ],
      "cost": 30,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "freeze_pipes_plan-heat-tape",
      "name": "Heat tape",
      "category": "heat",
      "tags": [
        "heat"
      ],
      "cost": 40,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "freeze_pipes_plan-shutoff-valve",
      "name": "Shutoff valve",
      "category": "shutoff",
      "tags": [
        "shutoff"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "freeze_pipes_plan-drain-valve",
      "name": "Drain valve",
      "category": "drain",
      "tags": [
        "drain"
      ],
      "cost": 20,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
