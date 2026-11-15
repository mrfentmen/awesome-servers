import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-travel-capsule-cost-mcp",
  "title": "Travel Capsule Budget Audit",
  "description": "Audit travel capsule budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "travel_capsule_budget",
  "entity": "travel item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
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
      "id": "travel_capsule_budget-merino-tee",
      "name": "Merino tee",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "travel_capsule_budget-travel-shirt",
      "name": "Travel shirt",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 55,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "travel_capsule_budget-travel-trousers",
      "name": "Travel trousers",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "travel_capsule_budget-rain-shell",
      "name": "Rain shell",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "travel_capsule_budget-walking-shoes",
      "name": "Walking shoes",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 140,
      "quantity": 140,
      "condition": "good"
    },
    {
      "id": "travel_capsule_budget-packable-scarf",
      "name": "Packable scarf",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    }
  ]
}
