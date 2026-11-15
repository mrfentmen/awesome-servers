import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-seasonal-storage-cost-mcp",
  "title": "Seasonal Storage Budget Audit",
  "description": "Audit seasonal storage budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "seasonal_storage_budget",
  "entity": "stored item budget line",
  "categories": [
    {
      "id": "winter",
      "label": "Winter",
      "baseline": 2
    },
    {
      "id": "summer",
      "label": "Summer",
      "baseline": 2
    },
    {
      "id": "occasion",
      "label": "Occasion",
      "baseline": 1
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 2
    },
    {
      "id": "bedding",
      "label": "Bedding",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "cold",
      "label": "Cold-weather layer",
      "categories": [
        "winter"
      ]
    },
    {
      "id": "warm",
      "label": "Warm-weather top",
      "categories": [
        "summer"
      ]
    },
    {
      "id": "occasion",
      "label": "Occasion wear",
      "categories": [
        "occasion"
      ]
    },
    {
      "id": "footwear",
      "label": "Footwear",
      "categories": [
        "shoes"
      ]
    }
  ],
  "sample": [
    {
      "id": "seasonal_storage_budget-wool-coat",
      "name": "Wool coat",
      "category": "winter",
      "tags": [
        "budget"
      ],
      "cost": 220,
      "quantity": 220,
      "condition": "good"
    },
    {
      "id": "seasonal_storage_budget-puffer-jacket",
      "name": "Puffer jacket",
      "category": "winter",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "seasonal_storage_budget-linen-shirt",
      "name": "Linen shirt",
      "category": "summer",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "seasonal_storage_budget-leather-sandals",
      "name": "Leather sandals",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "seasonal_storage_budget-formal-dress",
      "name": "Formal dress",
      "category": "occasion",
      "tags": [
        "budget"
      ],
      "cost": 160,
      "quantity": 160,
      "condition": "good"
    },
    {
      "id": "seasonal_storage_budget-spare-duvet",
      "name": "Spare duvet",
      "category": "bedding",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    }
  ]
}
