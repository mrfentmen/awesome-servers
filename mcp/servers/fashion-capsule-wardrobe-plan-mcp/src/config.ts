import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-capsule-wardrobe-plan-mcp",
  "title": "Capsule Wardrobe Planning Audit",
  "description": "Plan capsule wardrobe by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "capsule_wardrobe_plan",
  "entity": "wardrobe item plan",
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
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 10,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 1500,
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
      "id": "capsule_wardrobe_plan-tee",
      "name": "White tee",
      "category": "top",
      "tags": [
        "cotton",
        "basic"
      ],
      "cost": 20,
      "quantity": 20,
      "acquired": "2025-03-01",
      "lastUsed": "2026-11-01",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-shirt",
      "name": "Blue shirt",
      "category": "top",
      "tags": [
        "cotton",
        "business"
      ],
      "cost": 60,
      "quantity": 6,
      "acquired": "2025-02-01",
      "lastUsed": "2026-10-20",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-jeans",
      "name": "Jeans",
      "category": "bottom",
      "tags": [
        "denim",
        "casual"
      ],
      "cost": 80,
      "quantity": 4,
      "acquired": "2024-09-01",
      "lastUsed": "2026-11-02",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-trousers",
      "name": "Black trousers",
      "category": "bottom",
      "tags": [
        "wool",
        "business"
      ],
      "cost": 90,
      "quantity": 9,
      "acquired": "2024-10-01",
      "lastUsed": "2026-10-30",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-sneakers",
      "name": "Sneakers",
      "category": "shoes",
      "tags": [
        "leather",
        "casual"
      ],
      "cost": 100,
      "quantity": 10,
      "acquired": "2025-04-01",
      "lastUsed": "2026-11-03",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-trench",
      "name": "Trench",
      "category": "outerwear",
      "tags": [
        "rain",
        "layer"
      ],
      "cost": 200,
      "quantity": 5,
      "acquired": "2024-10-01",
      "lastUsed": "2026-10-25",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-underwear",
      "name": "Underwear",
      "category": "underwear",
      "tags": [
        "cotton",
        "daily"
      ],
      "cost": 0,
      "quantity": 100,
      "acquired": "2026-01-01",
      "lastUsed": "2026-11-03",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-belt",
      "name": "Belt",
      "category": "accessory",
      "tags": [
        "leather",
        "casual"
      ],
      "cost": 30,
      "quantity": 15,
      "acquired": "2024-01-01",
      "lastUsed": "2026-11-01",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-dress",
      "name": "Wrap dress",
      "category": "dress",
      "tags": [
        "formal",
        "wrap"
      ],
      "cost": 120,
      "quantity": 2,
      "acquired": "2023-12-01",
      "lastUsed": "2026-09-01",
      "condition": "good"
    },
    {
      "id": "capsule_wardrobe_plan-hoodie",
      "name": "Old hoodie",
      "category": "top",
      "tags": [
        "cotton",
        "lounge"
      ],
      "cost": 40,
      "quantity": 1,
      "acquired": "2023-01-01",
      "lastUsed": "2026-01-01",
      "condition": "worn"
    }
  ]
}
