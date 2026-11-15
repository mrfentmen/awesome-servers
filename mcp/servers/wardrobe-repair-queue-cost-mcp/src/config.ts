import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-repair-queue-cost-mcp",
  "title": "Repair Queue Budget Audit",
  "description": "Audit repair queue budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "repair_queue_budget",
  "entity": "repair item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 800,
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
      "id": "repair_queue_budget-sneaker-sole",
      "name": "Sneaker sole",
      "category": "shoe",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "repair_queue_budget-coat-seam",
      "name": "Coat seam",
      "category": "seam",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "repair_queue_budget-shirt-button",
      "name": "Shirt button",
      "category": "button",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "repair_queue_budget-bag-zip",
      "name": "Bag zip",
      "category": "zip",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "repair_queue_budget-leather-boots",
      "name": "Leather boots",
      "category": "leather",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "repair_queue_budget-trouser-hem",
      "name": "Trouser hem",
      "category": "seam",
      "tags": [
        "budget"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "good"
    }
  ]
}
