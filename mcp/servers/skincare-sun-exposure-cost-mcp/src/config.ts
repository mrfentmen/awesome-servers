import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-sun-exposure-cost-mcp",
  "title": "Sun Exposure Budget Audit",
  "description": "Audit sun exposure budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sun_exposure_budget",
  "entity": "sun-care item budget line",
  "categories": [
    {
      "id": "spf",
      "label": "Sunscreen",
      "baseline": 2
    },
    {
      "id": "hat",
      "label": "Hats",
      "baseline": 1
    },
    {
      "id": "sunglasses",
      "label": "Sunglasses",
      "baseline": 1
    },
    {
      "id": "shade",
      "label": "Shade",
      "baseline": 1
    },
    {
      "id": "aftercare",
      "label": "Aftercare",
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
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "sunscreen",
      "label": "Sunscreen",
      "categories": [
        "spf"
      ]
    },
    {
      "id": "cover",
      "label": "Physical cover",
      "categories": [
        "hat",
        "shade"
      ]
    },
    {
      "id": "eyes",
      "label": "Eye protection",
      "categories": [
        "sunglasses"
      ]
    },
    {
      "id": "after",
      "label": "Aftercare",
      "categories": [
        "aftercare"
      ]
    }
  ],
  "sample": [
    {
      "id": "sun_exposure_budget-spf-50-lotion",
      "name": "SPF 50 lotion",
      "category": "spf",
      "tags": [
        "budget"
      ],
      "cost": 32,
      "quantity": 32,
      "condition": "good"
    },
    {
      "id": "sun_exposure_budget-spf-stick",
      "name": "SPF stick",
      "category": "spf",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "sun_exposure_budget-wide-brim-hat",
      "name": "Wide-brim hat",
      "category": "hat",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "sun_exposure_budget-uv-sunglasses",
      "name": "UV sunglasses",
      "category": "sunglasses",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "sun_exposure_budget-shade-sail",
      "name": "Shade sail",
      "category": "shade",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "sun_exposure_budget-after-sun-gel",
      "name": "After-sun gel",
      "category": "aftercare",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
