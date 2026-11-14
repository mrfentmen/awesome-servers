import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-color-match-check-mcp",
  "title": "Color Match Audit",
  "description": "Audit a wardrobe palette for neutral, warm, cool and pattern coverage plus repeated tags. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "color_match",
  "entity": "wardrobe item",
  "categories": [
    {
      "id": "neutral",
      "label": "Neutrals",
      "baseline": 4
    },
    {
      "id": "warm",
      "label": "Warm tones",
      "baseline": 3
    },
    {
      "id": "cool",
      "label": "Cool tones",
      "baseline": 3
    },
    {
      "id": "pattern",
      "label": "Patterns",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "active_overlap",
    "label": "Palette overlap",
    "unit": "duplicate tags",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "neutral",
      "label": "Neutral base",
      "categories": [
        "neutral"
      ]
    },
    {
      "id": "warm",
      "label": "Warm accent",
      "categories": [
        "warm"
      ]
    },
    {
      "id": "cool",
      "label": "Cool accent",
      "categories": [
        "cool"
      ]
    },
    {
      "id": "pattern",
      "label": "Pattern",
      "categories": [
        "pattern"
      ]
    }
  ],
  "sample": [
    {
      "id": "color-tee",
      "name": "White tee",
      "category": "neutral",
      "tags": [
        "neutral",
        "base"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "color-trouser",
      "name": "Navy trousers",
      "category": "neutral",
      "tags": [
        "neutral",
        "base"
      ],
      "cost": 70,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "color-scarf",
      "name": "Rust scarf",
      "category": "warm",
      "tags": [
        "warm"
      ],
      "cost": 25,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "color-jacket",
      "name": "Olive jacket",
      "category": "cool",
      "tags": [
        "cool",
        "outer"
      ],
      "cost": 90,
      "quantity": 4,
      "condition": "fair"
    }
  ]
}
