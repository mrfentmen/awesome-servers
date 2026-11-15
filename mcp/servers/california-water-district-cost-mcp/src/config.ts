import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-water-district-cost-mcp",
  "title": "Water District Budget Audit",
  "description": "Audit water district budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "water_district_budget",
  "entity": "water item budget line",
  "categories": [
    {
      "id": "supply",
      "label": "Supply",
      "baseline": 2
    },
    {
      "id": "quality",
      "label": "Quality",
      "baseline": 1
    },
    {
      "id": "conservation",
      "label": "Conservation",
      "baseline": 1
    },
    {
      "id": "billing",
      "label": "Billing",
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
      "id": "supply",
      "label": "Supply",
      "categories": [
        "supply"
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
      "id": "conservation",
      "label": "Conservation",
      "categories": [
        "conservation"
      ]
    },
    {
      "id": "billing",
      "label": "Billing",
      "categories": [
        "billing"
      ]
    }
  ],
  "sample": [
    {
      "id": "water_district_budget-supply-audit",
      "name": "Supply audit",
      "category": "supply",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "water_district_budget-water-quality-test",
      "name": "Water quality test",
      "category": "quality",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "water_district_budget-low-flow-kit",
      "name": "Low-flow kit",
      "category": "conservation",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "water_district_budget-billing-review",
      "name": "Billing review",
      "category": "billing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
