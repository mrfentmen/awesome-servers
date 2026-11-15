import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-wash-cost-mcp",
  "title": "Car Wash Budget Audit",
  "description": "Audit car wash budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_wash_budget",
  "entity": "wash item budget line",
  "categories": [
    {
      "id": "exterior",
      "label": "Exterior",
      "baseline": 1
    },
    {
      "id": "wheels",
      "label": "Wheels",
      "baseline": 1
    },
    {
      "id": "glass",
      "label": "Glass",
      "baseline": 1
    },
    {
      "id": "interior",
      "label": "Interior",
      "baseline": 1
    },
    {
      "id": "protection",
      "label": "Protection",
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "body",
      "label": "Body wash",
      "categories": [
        "exterior"
      ]
    },
    {
      "id": "wheels",
      "label": "Wheel care",
      "categories": [
        "wheels"
      ]
    },
    {
      "id": "glass",
      "label": "Glass care",
      "categories": [
        "glass"
      ]
    },
    {
      "id": "cabin",
      "label": "Cabin care",
      "categories": [
        "interior"
      ]
    },
    {
      "id": "sealant",
      "label": "Paint protection",
      "categories": [
        "protection"
      ]
    }
  ],
  "sample": [
    {
      "id": "car_wash_budget-ph-neutral-soap",
      "name": "pH-neutral soap",
      "category": "exterior",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "car_wash_budget-wheel-cleaner",
      "name": "Wheel cleaner",
      "category": "wheels",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "car_wash_budget-glass-cleaner",
      "name": "Glass cleaner",
      "category": "glass",
      "tags": [
        "budget"
      ],
      "cost": 9,
      "quantity": 9,
      "condition": "good"
    },
    {
      "id": "car_wash_budget-interior-vacuum",
      "name": "Interior vacuum",
      "category": "interior",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "car_wash_budget-liquid-wax",
      "name": "Liquid wax",
      "category": "protection",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "car_wash_budget-microfibre-mitt",
      "name": "Microfibre mitt",
      "category": "exterior",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
