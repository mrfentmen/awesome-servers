import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-cistern-sizing-cost-mcp",
  "title": "Cistern Sizing Budget Audit",
  "description": "Audit cistern sizing budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cistern_sizing_budget",
  "entity": "cistern item budget line",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "tank",
      "label": "Tank",
      "baseline": 1
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "overflow",
      "label": "Overflow",
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
    "budget": 1250,
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
      "id": "tank",
      "label": "Tank",
      "categories": [
        "tank"
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
      "id": "overflow",
      "label": "Overflow",
      "categories": [
        "overflow"
      ]
    }
  ],
  "sample": [
    {
      "id": "cistern_sizing_budget-catchment-assessment",
      "name": "Catchment assessment",
      "category": "roof",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "cistern_sizing_budget-cistern",
      "name": "Cistern",
      "category": "tank",
      "tags": [
        "budget"
      ],
      "cost": 900,
      "quantity": 900,
      "condition": "new"
    },
    {
      "id": "cistern_sizing_budget-filter",
      "name": "Filter",
      "category": "filter",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "cistern_sizing_budget-overflow",
      "name": "Overflow",
      "category": "overflow",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    }
  ]
}
