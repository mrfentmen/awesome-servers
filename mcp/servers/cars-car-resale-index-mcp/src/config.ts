import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-resale-index-mcp",
  "title": "Car Resale Archive",
  "description": "Archive car resale by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_resale_index",
  "entity": "resale record archive",
  "categories": [
    {
      "id": "valuation",
      "label": "Valuation",
      "baseline": 1
    },
    {
      "id": "service",
      "label": "Service",
      "baseline": 1
    },
    {
      "id": "condition",
      "label": "Condition",
      "baseline": 1
    },
    {
      "id": "listing",
      "label": "Listing",
      "baseline": 1
    },
    {
      "id": "paperwork",
      "label": "Paperwork",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "readiness_score",
    "label": "Readiness score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "price",
      "label": "Price",
      "categories": [
        "valuation"
      ]
    },
    {
      "id": "history",
      "label": "Service history",
      "categories": [
        "service"
      ]
    },
    {
      "id": "condition",
      "label": "Condition",
      "categories": [
        "condition"
      ]
    },
    {
      "id": "advert",
      "label": "Advert",
      "categories": [
        "listing"
      ]
    },
    {
      "id": "documents",
      "label": "Documents",
      "categories": [
        "paperwork"
      ]
    }
  ],
  "sample": [
    {
      "id": "car_resale_index-value",
      "name": "Market valuation",
      "category": "valuation",
      "tags": [
        "kbb",
        "local"
      ],
      "cost": 0,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "car_resale_index-service",
      "name": "Service history",
      "category": "service",
      "tags": [
        "full",
        "dealer"
      ],
      "cost": 0,
      "quantity": 92,
      "condition": "good"
    },
    {
      "id": "car_resale_index-tires",
      "name": "Tire tread",
      "category": "condition",
      "tags": [
        "6mm",
        "matching"
      ],
      "cost": 0,
      "quantity": 78,
      "condition": "fair"
    },
    {
      "id": "car_resale_index-photos",
      "name": "Listing photos",
      "category": "listing",
      "tags": [
        "20-shots",
        "daylight"
      ],
      "cost": 0,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "car_resale_index-title",
      "name": "Clean title",
      "category": "paperwork",
      "tags": [
        "lien-free",
        "current"
      ],
      "cost": 0,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "car_resale_index-detail",
      "name": "Paint correction",
      "category": "condition",
      "tags": [
        "polish",
        "ceramic"
      ],
      "cost": 250,
      "quantity": 65,
      "condition": "fair"
    }
  ]
}
