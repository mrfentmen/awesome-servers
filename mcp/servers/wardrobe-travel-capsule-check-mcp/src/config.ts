import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-travel-capsule-check-mcp",
  "title": "Travel Capsule Audit",
  "description": "Audit travel capsule by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "travel_capsule",
  "entity": "travel item",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 3
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 2
    },
    {
      "id": "outerwear",
      "label": "Outerwear",
      "baseline": 1
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 2
    },
    {
      "id": "accessory",
      "label": "Accessories",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "pack_weight",
    "label": "Pack weight",
    "unit": "kg",
    "target": 8,
    "direction": "lower"
  },
  "target": {
    "maxItems": 12,
    "budget": 900,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "outfits",
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
      "id": "layer",
      "label": "Outer layer",
      "categories": [
        "outerwear"
      ]
    },
    {
      "id": "extras",
      "label": "Accessories",
      "categories": [
        "accessory"
      ]
    }
  ],
  "sample": [
    {
      "id": "travel_capsule-tee",
      "name": "Merino tee",
      "category": "top",
      "tags": [
        "merino",
        "quick-dry"
      ],
      "cost": 70,
      "quantity": 0.2,
      "condition": "good"
    },
    {
      "id": "travel_capsule-shirt",
      "name": "Travel shirt",
      "category": "top",
      "tags": [
        "cotton",
        "smart"
      ],
      "cost": 55,
      "quantity": 0.25,
      "condition": "good"
    },
    {
      "id": "travel_capsule-trousers",
      "name": "Travel trousers",
      "category": "bottom",
      "tags": [
        "stretch",
        "dark"
      ],
      "cost": 90,
      "quantity": 0.4,
      "condition": "good"
    },
    {
      "id": "travel_capsule-shell",
      "name": "Rain shell",
      "category": "outerwear",
      "tags": [
        "waterproof",
        "packable"
      ],
      "cost": 180,
      "quantity": 0.5,
      "condition": "good"
    },
    {
      "id": "travel_capsule-shoes",
      "name": "Walking shoes",
      "category": "shoes",
      "tags": [
        "leather",
        "comfort"
      ],
      "cost": 140,
      "quantity": 0.8,
      "condition": "good"
    },
    {
      "id": "travel_capsule-scarf",
      "name": "Packable scarf",
      "category": "accessory",
      "tags": [
        "wool",
        "layer"
      ],
      "cost": 40,
      "quantity": 0.1,
      "condition": "good"
    }
  ]
}
