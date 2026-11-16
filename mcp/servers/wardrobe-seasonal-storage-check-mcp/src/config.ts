import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-seasonal-storage-check-mcp",
  "title": "Seasonal Storage Audit",
  "description": "Audit seasonal storage by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "seasonal_storage",
  "entity": "stored item",
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
    "id": "storage_days",
    "label": "Storage days",
    "unit": "days",
    "target": 180,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 400,
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
      "id": "seasonal_storage-coat",
      "name": "Wool coat",
      "category": "winter",
      "tags": [
        "wool",
        "formal"
      ],
      "cost": 220,
      "quantity": 210,
      "condition": "good"
    },
    {
      "id": "seasonal_storage-puffer",
      "name": "Puffer jacket",
      "category": "winter",
      "tags": [
        "down",
        "casual"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "seasonal_storage-shirt",
      "name": "Linen shirt",
      "category": "summer",
      "tags": [
        "linen",
        "light"
      ],
      "cost": 60,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "seasonal_storage-sandals",
      "name": "Leather sandals",
      "category": "shoes",
      "tags": [
        "leather",
        "summer"
      ],
      "cost": 80,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "seasonal_storage-dress",
      "name": "Formal dress",
      "category": "occasion",
      "tags": [
        "silk",
        "evening"
      ],
      "cost": 160,
      "quantity": 300,
      "condition": "good"
    },
    {
      "id": "seasonal_storage-duvet",
      "name": "Spare duvet",
      "category": "bedding",
      "tags": [
        "down",
        "winter"
      ],
      "cost": 120,
      "quantity": 240,
      "condition": "good"
    }
  ]
}
