import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-repair-queue-index-mcp",
  "title": "Repair Queue Archive",
  "description": "Archive repair queue by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "repair_queue_index",
  "entity": "repair item archive",
  "categories": [
    {
      "id": "shoe",
      "label": "Shoes",
      "baseline": 2
    },
    {
      "id": "seam",
      "label": "Seams",
      "baseline": 2
    },
    {
      "id": "button",
      "label": "Buttons",
      "baseline": 2
    },
    {
      "id": "zip",
      "label": "Zips",
      "baseline": 1
    },
    {
      "id": "leather",
      "label": "Leather",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "repair_cost",
    "label": "Repair cost",
    "unit": "USD",
    "target": 40,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "shoes",
      "label": "Footwear repair",
      "categories": [
        "shoe"
      ]
    },
    {
      "id": "seams",
      "label": "Seam repair",
      "categories": [
        "seam"
      ]
    },
    {
      "id": "fasteners",
      "label": "Fasteners",
      "categories": [
        "button",
        "zip"
      ]
    },
    {
      "id": "leather",
      "label": "Leather care",
      "categories": [
        "leather"
      ]
    }
  ],
  "sample": [
    {
      "id": "repair_queue_index-sole",
      "name": "Sneaker sole",
      "category": "shoe",
      "tags": [
        "rubber",
        "everyday"
      ],
      "cost": 60,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "repair_queue_index-coat",
      "name": "Coat seam",
      "category": "seam",
      "tags": [
        "wool",
        "winter"
      ],
      "cost": 200,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "repair_queue_index-shirt",
      "name": "Shirt button",
      "category": "button",
      "tags": [
        "cotton",
        "work"
      ],
      "cost": 35,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "repair_queue_index-bag",
      "name": "Bag zip",
      "category": "zip",
      "tags": [
        "nylon",
        "travel"
      ],
      "cost": 120,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "repair_queue_index-boots",
      "name": "Leather boots",
      "category": "leather",
      "tags": [
        "leather",
        "winter"
      ],
      "cost": 180,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "repair_queue_index-trousers",
      "name": "Trouser hem",
      "category": "seam",
      "tags": [
        "wool",
        "formal"
      ],
      "cost": 70,
      "quantity": 18,
      "condition": "good"
    }
  ]
}
