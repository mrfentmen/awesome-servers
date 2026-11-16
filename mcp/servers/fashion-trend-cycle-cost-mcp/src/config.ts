import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-trend-cycle-cost-mcp",
  "title": "Trend Cycle Budget Audit",
  "description": "Audit trend cycle budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "trend_cycle_budget",
  "entity": "trend garment budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 1350,
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
      "id": "trend_cycle_budget-ribbed-knit-top",
      "name": "Ribbed knit top",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 65,
      "quantity": 65,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-oversized-shirt",
      "name": "Oversized shirt",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-wide-leg-jeans",
      "name": "Wide-leg jeans",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 95,
      "quantity": 95,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-midi-skirt",
      "name": "Midi skirt",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "fair"
    },
    {
      "id": "trend_cycle_budget-boxy-blazer",
      "name": "Boxy blazer",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 160,
      "quantity": 160,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-long-coat",
      "name": "Long coat",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 240,
      "quantity": 240,
      "condition": "fair"
    },
    {
      "id": "trend_cycle_budget-chunky-sneaker",
      "name": "Chunky sneaker",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 130,
      "quantity": 130,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-penny-loafer",
      "name": "Penny loafer",
      "category": "shoes",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-mini-shoulder-bag",
      "name": "Mini shoulder bag",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "trend_cycle_budget-silk-scarf",
      "name": "Silk scarf",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "worn"
    }
  ]
}
