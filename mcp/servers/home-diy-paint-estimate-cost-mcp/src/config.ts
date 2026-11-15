import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-paint-estimate-cost-mcp",
  "title": "Paint Estimate Budget Audit",
  "description": "Audit paint estimate budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "paint_estimate_budget",
  "entity": "paint item budget line",
  "categories": [
    {
      "id": "wall",
      "label": "Wall paint",
      "baseline": 3
    },
    {
      "id": "trim",
      "label": "Trim paint",
      "baseline": 2
    },
    {
      "id": "ceiling",
      "label": "Ceiling paint",
      "baseline": 1
    },
    {
      "id": "primer",
      "label": "Primer",
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
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wall",
      "label": "Wall coating",
      "categories": [
        "wall"
      ]
    },
    {
      "id": "trim",
      "label": "Trim coating",
      "categories": [
        "trim"
      ]
    },
    {
      "id": "ceiling",
      "label": "Ceiling coating",
      "categories": [
        "ceiling"
      ]
    },
    {
      "id": "primer",
      "label": "Primer",
      "categories": [
        "primer"
      ]
    }
  ],
  "sample": [
    {
      "id": "paint_estimate_budget-living-room-wall-paint",
      "name": "Living room wall paint",
      "category": "wall",
      "tags": [
        "budget"
      ],
      "cost": 55,
      "quantity": 55,
      "condition": "new"
    },
    {
      "id": "paint_estimate_budget-white-trim-paint",
      "name": "White trim paint",
      "category": "trim",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "paint_estimate_budget-ceiling-white",
      "name": "Ceiling white",
      "category": "ceiling",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "new"
    },
    {
      "id": "paint_estimate_budget-multi-surface-primer",
      "name": "Multi-surface primer",
      "category": "primer",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "paint_estimate_budget-exterior-wall-paint",
      "name": "Exterior wall paint",
      "category": "wall",
      "tags": [
        "budget"
      ],
      "cost": 65,
      "quantity": 65,
      "condition": "good"
    }
  ]
}
