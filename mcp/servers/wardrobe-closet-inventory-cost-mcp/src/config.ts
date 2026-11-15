import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-closet-inventory-cost-mcp",
  "title": "Closet Inventory Budget Audit",
  "description": "Audit closet inventory budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "closet_inventory_budget",
  "entity": "closet item budget line",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 8
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 5
    },
    {
      "id": "dress",
      "label": "Dresses",
      "baseline": 2
    },
    {
      "id": "outerwear",
      "label": "Outerwear",
      "baseline": 2
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 4
    },
    {
      "id": "accessory",
      "label": "Accessories",
      "baseline": 3
    },
    {
      "id": "underwear",
      "label": "Underwear",
      "baseline": 8
    },
    {
      "id": "activewear",
      "label": "Activewear",
      "baseline": 3
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
    "budget": 750,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "top-bottom",
      "label": "Top and bottom pairing",
      "categories": [
        "top",
        "bottom"
      ]
    },
    {
      "id": "shoes",
      "label": "Footwear",
      "categories": [
        "shoes"
      ]
    },
    {
      "id": "outerwear",
      "label": "Outer layer",
      "categories": [
        "outerwear"
      ]
    }
  ],
  "sample": [
    {
      "id": "closet_inventory_budget-white-tee",
      "name": "White tee",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-straight-jeans",
      "name": "Straight jeans",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-white-sneakers",
      "name": "White sneakers",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-trench-coat",
      "name": "Trench coat",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-leather-belt",
      "name": "Leather belt",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "closet_inventory_budget-cotton-socks",
      "name": "Cotton socks",
      "category": "underwear",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-training-leggings",
      "name": "Training leggings",
      "category": "activewear",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "closet_inventory_budget-black-dress",
      "name": "Black dress",
      "category": "dress",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    }
  ]
}
