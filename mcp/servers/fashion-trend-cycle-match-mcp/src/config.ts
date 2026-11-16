import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-trend-cycle-match-mcp",
  "title": "Trend Cycle Match Audit",
  "description": "Match trend cycle by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "trend_cycle_match",
  "entity": "trend garment match",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 3
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 3
    },
    {
      "id": "outerwear",
      "label": "Outerwear",
      "baseline": 2
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 2
    },
    {
      "id": "accessory",
      "label": "Accessories",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "days_since_wear",
    "label": "Days since wear",
    "unit": "days",
    "target": 30,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 800,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "base-outfit",
      "label": "Base outfit",
      "categories": [
        "top",
        "bottom"
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
      "id": "footwear",
      "label": "Footwear",
      "categories": [
        "shoes"
      ]
    },
    {
      "id": "finish",
      "label": "Accessory finish",
      "categories": [
        "accessory"
      ]
    }
  ],
  "sample": [
    {
      "id": "trend_cycle_match-knit",
      "name": "Ribbed knit top",
      "category": "top",
      "tags": [
        "neutral",
        "current"
      ],
      "cost": 65,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-shirt",
      "name": "Oversized shirt",
      "category": "top",
      "tags": [
        "poplin",
        "current"
      ],
      "cost": 70,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-jeans",
      "name": "Wide-leg jeans",
      "category": "bottom",
      "tags": [
        "denim",
        "current"
      ],
      "cost": 95,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-skirt",
      "name": "Midi skirt",
      "category": "bottom",
      "tags": [
        "satin",
        "current"
      ],
      "cost": 80,
      "quantity": 18,
      "condition": "fair"
    },
    {
      "id": "trend_cycle_match-blazer",
      "name": "Boxy blazer",
      "category": "outerwear",
      "tags": [
        "tailored",
        "current"
      ],
      "cost": 160,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-coat",
      "name": "Long coat",
      "category": "outerwear",
      "tags": [
        "wool",
        "seasonal"
      ],
      "cost": 240,
      "quantity": 42,
      "condition": "fair"
    },
    {
      "id": "trend_cycle_match-sneaker",
      "name": "Chunky sneaker",
      "category": "shoes",
      "tags": [
        "leather",
        "current"
      ],
      "cost": 130,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-loafer",
      "name": "Penny loafer",
      "category": "shoes",
      "tags": [
        "leather",
        "classic"
      ],
      "cost": 150,
      "quantity": 21,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-bag",
      "name": "Mini shoulder bag",
      "category": "accessory",
      "tags": [
        "leather",
        "current"
      ],
      "cost": 90,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "trend_cycle_match-scarf",
      "name": "Silk scarf",
      "category": "accessory",
      "tags": [
        "print",
        "accent"
      ],
      "cost": 45,
      "quantity": 55,
      "condition": "worn"
    }
  ]
}
