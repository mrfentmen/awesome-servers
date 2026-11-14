import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-tire-wear-check-mcp",
  "title": "Tire Wear Audit",
  "description": "Audit front, rear, spare and winter tires for tread depth and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tire_wear",
  "entity": "tire",
  "categories": [
    {
      "id": "front",
      "label": "Front tires",
      "baseline": 2
    },
    {
      "id": "rear",
      "label": "Rear tires",
      "baseline": 2
    },
    {
      "id": "spare",
      "label": "Spare",
      "baseline": 1
    },
    {
      "id": "winter",
      "label": "Winter tires",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Tread depth",
    "unit": "mm",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "front",
      "label": "Front axle",
      "categories": [
        "front"
      ]
    },
    {
      "id": "rear",
      "label": "Rear axle",
      "categories": [
        "rear"
      ]
    },
    {
      "id": "spare",
      "label": "Spare",
      "categories": [
        "spare"
      ]
    },
    {
      "id": "winter",
      "label": "Winter set",
      "categories": [
        "winter"
      ]
    }
  ],
  "sample": [
    {
      "id": "tire-front",
      "name": "Front left",
      "category": "front",
      "tags": [
        "summer"
      ],
      "cost": 120,
      "quantity": 5.5,
      "condition": "good"
    },
    {
      "id": "tire-rear",
      "name": "Rear right",
      "category": "rear",
      "tags": [
        "summer"
      ],
      "cost": 120,
      "quantity": 4.2,
      "condition": "fair"
    },
    {
      "id": "tire-spare",
      "name": "Spare tire",
      "category": "spare",
      "tags": [
        "compact"
      ],
      "cost": 90,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "tire-winter",
      "name": "Winter set",
      "category": "winter",
      "tags": [
        "winter"
      ],
      "cost": 400,
      "quantity": 3,
      "condition": "worn"
    }
  ]
}
