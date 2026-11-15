import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-commute-exposure-cost-mcp",
  "title": "Commute Exposure Budget Audit",
  "description": "Audit commute exposure budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "commute_exposure_budget",
  "entity": "commute leg budget line",
  "categories": [
    {
      "id": "route",
      "label": "Route",
      "baseline": 2
    },
    {
      "id": "mode",
      "label": "Mode",
      "baseline": 1
    },
    {
      "id": "mask",
      "label": "Mask",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "mode",
      "label": "Mode",
      "categories": [
        "mode"
      ]
    },
    {
      "id": "mask",
      "label": "Mask",
      "categories": [
        "mask"
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
      "id": "commute_exposure_budget-route-air-test",
      "name": "Route air test",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "commute_exposure_budget-bike-route-setup",
      "name": "Bike route setup",
      "category": "mode",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "commute_exposure_budget-n95-masks",
      "name": "N95 masks",
      "category": "mask",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "commute_exposure_budget-schedule-shift",
      "name": "Schedule shift",
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
