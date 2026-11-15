import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-wash-index-mcp",
  "title": "Car Wash Archive",
  "description": "Archive car wash by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_wash_index",
  "entity": "wash item archive",
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
    "id": "wash_minutes",
    "label": "Wash minutes",
    "unit": "min",
    "target": 45,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
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
      "id": "car_wash_index-soap",
      "name": "pH-neutral soap",
      "category": "exterior",
      "tags": [
        "foam",
        "safe"
      ],
      "cost": 18,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "car_wash_index-wheel",
      "name": "Wheel cleaner",
      "category": "wheels",
      "tags": [
        "iron-remover",
        "spray"
      ],
      "cost": 15,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "car_wash_index-glass",
      "name": "Glass cleaner",
      "category": "glass",
      "tags": [
        "streak-free",
        "spray"
      ],
      "cost": 9,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "car_wash_index-vacuum",
      "name": "Interior vacuum",
      "category": "interior",
      "tags": [
        "crevice",
        "15min"
      ],
      "cost": 0,
      "quantity": 15,
      "condition": "fair"
    },
    {
      "id": "car_wash_index-wax",
      "name": "Liquid wax",
      "category": "protection",
      "tags": [
        "synthetic",
        "annual"
      ],
      "cost": 25,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "car_wash_index-mitt",
      "name": "Microfibre mitt",
      "category": "exterior",
      "tags": [
        "soft",
        "washable"
      ],
      "cost": 12,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
