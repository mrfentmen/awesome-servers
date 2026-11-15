import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-capsule-wardrobe-cost-mcp",
  "title": "Capsule Wardrobe Budget Audit",
  "description": "Audit capsule wardrobe budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "capsule_wardrobe_budget",
  "entity": "wardrobe item budget line",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 6
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 4
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
      "baseline": 3
    },
    {
      "id": "accessory",
      "label": "Accessories",
      "baseline": 3
    },
    {
      "id": "underwear",
      "label": "Underwear",
      "baseline": 7
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
    "budget": 900,
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
      "id": "dress",
      "label": "Dress option",
      "categories": [
        "dress"
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
      "id": "capsule_wardrobe_budget-white-tee",
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
      "id": "capsule_wardrobe_budget-blue-shirt",
      "name": "Blue shirt",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-jeans",
      "name": "Jeans",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-black-trousers",
      "name": "Black trousers",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-sneakers",
      "name": "Sneakers",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-trench",
      "name": "Trench",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-underwear",
      "name": "Underwear",
      "category": "underwear",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-belt",
      "name": "Belt",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-wrap-dress",
      "name": "Wrap dress",
      "category": "dress",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_budget-old-hoodie",
      "name": "Old hoodie",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "worn"
    }
  ]
}
