import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-look-recreate-index-mcp",
  "title": "Look Recreation Archive",
  "description": "Archive look recreation by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "look_recreate_index",
  "entity": "look product archive",
  "categories": [
    {
      "id": "base",
      "label": "Base",
      "baseline": 1
    },
    {
      "id": "eye",
      "label": "Eyes",
      "baseline": 2
    },
    {
      "id": "lip",
      "label": "Lips",
      "baseline": 1
    },
    {
      "id": "cheek",
      "label": "Cheeks",
      "baseline": 1
    },
    {
      "id": "tool",
      "label": "Tools",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "look_coverage",
    "label": "Look coverage",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Complexion",
      "categories": [
        "base"
      ]
    },
    {
      "id": "eye",
      "label": "Eye look",
      "categories": [
        "eye"
      ]
    },
    {
      "id": "lip",
      "label": "Lip colour",
      "categories": [
        "lip"
      ]
    },
    {
      "id": "cheek",
      "label": "Cheek colour",
      "categories": [
        "cheek"
      ]
    }
  ],
  "sample": [
    {
      "id": "look_recreate_index-foundation",
      "name": "Matte foundation",
      "category": "base",
      "tags": [
        "matte",
        "medium"
      ],
      "cost": 42,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "look_recreate_index-palette",
      "name": "Shadow palette",
      "category": "eye",
      "tags": [
        "neutral",
        "shimmer"
      ],
      "cost": 38,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "look_recreate_index-liner",
      "name": "Liquid liner",
      "category": "eye",
      "tags": [
        "black",
        "sharp"
      ],
      "cost": 22,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "look_recreate_index-lipstick",
      "name": "Red lipstick",
      "category": "lip",
      "tags": [
        "red",
        "matte"
      ],
      "cost": 30,
      "quantity": 95,
      "condition": "good"
    },
    {
      "id": "look_recreate_index-blush",
      "name": "Cream blush",
      "category": "cheek",
      "tags": [
        "peach",
        "cream"
      ],
      "cost": 28,
      "quantity": 65,
      "condition": "good"
    },
    {
      "id": "look_recreate_index-brush",
      "name": "Blending brush",
      "category": "tool",
      "tags": [
        "synthetic"
      ],
      "cost": 18,
      "quantity": 100,
      "condition": "good"
    }
  ]
}
