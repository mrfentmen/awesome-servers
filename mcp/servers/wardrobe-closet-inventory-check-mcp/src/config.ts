import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-closet-inventory-check-mcp",
  "title": "Closet Inventory Audit",
  "description": "Audit a wardrobe by category, cost per wear, condition, expiry window and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "closet_inventory",
  "entity": "closet item",
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
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 10,
    "direction": "lower"
  },
  "target": {
    "maxItems": 40,
    "budget": 1500,
    "coverage": 0.8,
    "expiryDays": 30
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
      "id": "closet-tee",
      "name": "White tee",
      "category": "top",
      "tags": [
        "cotton",
        "basic"
      ],
      "cost": 20,
      "quantity": 24,
      "acquired": "2025-03-01",
      "lastUsed": "2026-11-01",
      "condition": "good"
    },
    {
      "id": "closet-jeans",
      "name": "Straight jeans",
      "category": "bottom",
      "tags": [
        "denim"
      ],
      "cost": 80,
      "quantity": 4,
      "acquired": "2024-09-01",
      "lastUsed": "2026-11-03",
      "condition": "good"
    },
    {
      "id": "closet-sneakers",
      "name": "White sneakers",
      "category": "shoes",
      "tags": [
        "leather"
      ],
      "cost": 100,
      "quantity": 10,
      "acquired": "2025-04-01",
      "lastUsed": "2026-11-02",
      "condition": "good"
    },
    {
      "id": "closet-trench",
      "name": "Trench coat",
      "category": "outerwear",
      "tags": [
        "rain"
      ],
      "cost": 200,
      "quantity": 5,
      "acquired": "2024-10-01",
      "lastUsed": "2026-10-20",
      "condition": "good"
    },
    {
      "id": "closet-belt",
      "name": "Leather belt",
      "category": "accessory",
      "tags": [
        "leather"
      ],
      "cost": 30,
      "quantity": 15,
      "acquired": "2023-01-01",
      "lastUsed": "2026-10-28",
      "condition": "fair"
    },
    {
      "id": "closet-socks",
      "name": "Cotton socks",
      "category": "underwear",
      "tags": [
        "cotton"
      ],
      "cost": 10,
      "quantity": 30,
      "acquired": "2026-01-01",
      "lastUsed": "2026-11-01",
      "condition": "good"
    },
    {
      "id": "closet-leggings",
      "name": "Training leggings",
      "category": "activewear",
      "tags": [
        "stretch"
      ],
      "cost": 40,
      "quantity": 12,
      "acquired": "2025-06-01",
      "lastUsed": "2026-11-04",
      "condition": "good"
    },
    {
      "id": "closet-dress",
      "name": "Black dress",
      "category": "dress",
      "tags": [
        "evening"
      ],
      "cost": 120,
      "quantity": 2,
      "acquired": "2023-12-01",
      "lastUsed": "2026-09-01",
      "condition": "fair"
    }
  ]
}
