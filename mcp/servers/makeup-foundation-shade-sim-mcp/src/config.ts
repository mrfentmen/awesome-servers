import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-foundation-shade-sim-mcp",
  "title": "Foundation Shade Simulator",
  "description": "Simulate foundation shade by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "foundation_shade_sim",
  "entity": "foundation product simulation",
  "categories": [
    {
      "id": "liquid",
      "label": "Liquid",
      "baseline": 2
    },
    {
      "id": "stick",
      "label": "Stick",
      "baseline": 1
    },
    {
      "id": "powder",
      "label": "Powder",
      "baseline": 1
    },
    {
      "id": "tint",
      "label": "Tinted base",
      "baseline": 2
    },
    {
      "id": "tool",
      "label": "Tools",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "shade_match",
    "label": "Shade match",
    "unit": "%",
    "target": 85,
    "direction": "higher"
  },
  "target": {
    "maxItems": 10,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Base coverage",
      "categories": [
        "liquid",
        "stick",
        "powder"
      ]
    },
    {
      "id": "tint",
      "label": "Tinted base",
      "categories": [
        "tint"
      ]
    },
    {
      "id": "tool",
      "label": "Application tool",
      "categories": [
        "tool"
      ]
    }
  ],
  "sample": [
    {
      "id": "foundation_shade_sim-liquid",
      "name": "Liquid foundation",
      "category": "liquid",
      "tags": [
        "neutral",
        "medium"
      ],
      "cost": 45,
      "quantity": 92,
      "condition": "good"
    },
    {
      "id": "foundation_shade_sim-concealer",
      "name": "Liquid concealer",
      "category": "liquid",
      "tags": [
        "warm",
        "light"
      ],
      "cost": 28,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "foundation_shade_sim-stick",
      "name": "Cream stick",
      "category": "stick",
      "tags": [
        "neutral",
        "travel"
      ],
      "cost": 32,
      "quantity": 75,
      "condition": "fair"
    },
    {
      "id": "foundation_shade_sim-powder",
      "name": "Loose powder",
      "category": "powder",
      "tags": [
        "translucent"
      ],
      "cost": 30,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "foundation_shade_sim-tint",
      "name": "Skin tint",
      "category": "tint",
      "tags": [
        "light",
        "summer"
      ],
      "cost": 36,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "foundation_shade_sim-brush",
      "name": "Foundation brush",
      "category": "tool",
      "tags": [
        "synthetic"
      ],
      "cost": 20,
      "quantity": 100,
      "condition": "good"
    }
  ]
}
