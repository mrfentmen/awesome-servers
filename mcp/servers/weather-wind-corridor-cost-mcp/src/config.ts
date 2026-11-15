import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-wind-corridor-cost-mcp",
  "title": "Wind Corridor Budget Audit",
  "description": "Audit wind corridor budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "wind_corridor_budget",
  "entity": "wind item budget line",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "fence",
      "label": "Fence",
      "baseline": 1
    },
    {
      "id": "trees",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "anchors",
      "label": "Anchors",
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
    "budget": 1600,
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
      "id": "fence",
      "label": "Fence",
      "categories": [
        "fence"
      ]
    },
    {
      "id": "trees",
      "label": "Trees",
      "categories": [
        "trees"
      ]
    },
    {
      "id": "anchors",
      "label": "Anchors",
      "categories": [
        "anchors"
      ]
    }
  ],
  "sample": [
    {
      "id": "wind_corridor_budget-roof-inspection",
      "name": "Roof inspection",
      "category": "roof",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "wind_corridor_budget-fence-repair",
      "name": "Fence repair",
      "category": "fence",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "wind_corridor_budget-tree-trimming",
      "name": "Tree trimming",
      "category": "trees",
      "tags": [
        "budget"
      ],
      "cost": 400,
      "quantity": 400,
      "condition": "new"
    },
    {
      "id": "wind_corridor_budget-guy-anchors",
      "name": "Guy anchors",
      "category": "anchors",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    }
  ]
}
