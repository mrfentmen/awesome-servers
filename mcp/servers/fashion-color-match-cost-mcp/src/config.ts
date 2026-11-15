import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-color-match-cost-mcp",
  "title": "Color Match Budget Audit",
  "description": "Audit color match budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "color_match_budget",
  "entity": "wardrobe item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
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
      "id": "color_match_budget-white-tee",
      "name": "White tee",
      "category": "neutral",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "color_match_budget-navy-trousers",
      "name": "Navy trousers",
      "category": "neutral",
      "tags": [
        "budget"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "color_match_budget-rust-scarf",
      "name": "Rust scarf",
      "category": "warm",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "color_match_budget-olive-jacket",
      "name": "Olive jacket",
      "category": "cool",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "fair"
    }
  ]
}
