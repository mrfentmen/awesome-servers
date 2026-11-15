import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-pollen-burst-cost-mcp",
  "title": "Pollen Burst Budget Audit",
  "description": "Audit pollen burst budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pollen_burst_budget",
  "entity": "pollen item budget line",
  "categories": [
    {
      "id": "indoor",
      "label": "Indoor",
      "baseline": 2
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 1
    },
    {
      "id": "laundry",
      "label": "Laundry",
      "baseline": 1
    },
    {
      "id": "timing",
      "label": "Timing",
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "indoor",
      "label": "Indoor",
      "categories": [
        "indoor"
      ]
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "categories": [
        "hvac"
      ]
    },
    {
      "id": "laundry",
      "label": "Laundry",
      "categories": [
        "laundry"
      ]
    },
    {
      "id": "timing",
      "label": "Timing",
      "categories": [
        "timing"
      ]
    }
  ],
  "sample": [
    {
      "id": "pollen_burst_budget-indoor-air-test",
      "name": "Indoor air test",
      "category": "indoor",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "pollen_burst_budget-hvac-filter",
      "name": "HVAC filter",
      "category": "hvac",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "pollen_burst_budget-laundry-setup",
      "name": "Laundry setup",
      "category": "laundry",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "pollen_burst_budget-timing-plan",
      "name": "Timing plan",
      "category": "timing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
