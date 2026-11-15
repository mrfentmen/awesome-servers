import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-brush-hygiene-match-mcp",
  "title": "Brush Hygiene Match Audit",
  "description": "Match brush hygiene by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "brush_hygiene_match",
  "entity": "makeup tool match",
  "categories": [
    {
      "id": "face",
      "label": "Face brushes",
      "baseline": 2
    },
    {
      "id": "eye",
      "label": "Eye brushes",
      "baseline": 2
    },
    {
      "id": "lip",
      "label": "Lip tools",
      "baseline": 1
    },
    {
      "id": "sponge",
      "label": "Sponges",
      "baseline": 1
    },
    {
      "id": "storage",
      "label": "Storage",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "days_since_wash",
    "label": "Days since wash",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 200,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "face",
      "label": "Face tools",
      "categories": [
        "face"
      ]
    },
    {
      "id": "eye",
      "label": "Eye tools",
      "categories": [
        "eye"
      ]
    },
    {
      "id": "lip",
      "label": "Lip tools",
      "categories": [
        "lip"
      ]
    },
    {
      "id": "storage",
      "label": "Storage",
      "categories": [
        "storage"
      ]
    }
  ],
  "sample": [
    {
      "id": "brush_hygiene_match-foundation",
      "name": "Foundation brush",
      "category": "face",
      "tags": [
        "synthetic",
        "daily"
      ],
      "cost": 25,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_match-powder",
      "name": "Powder brush",
      "category": "face",
      "tags": [
        "natural",
        "weekly"
      ],
      "cost": 30,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "brush_hygiene_match-shadow",
      "name": "Shadow brush",
      "category": "eye",
      "tags": [
        "synthetic",
        "detail"
      ],
      "cost": 15,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_match-liner",
      "name": "Liner brush",
      "category": "eye",
      "tags": [
        "fine",
        "detail"
      ],
      "cost": 12,
      "quantity": 30,
      "condition": "worn"
    },
    {
      "id": "brush_hygiene_match-lip",
      "name": "Lip brush",
      "category": "lip",
      "tags": [
        "retractable"
      ],
      "cost": 10,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_match-sponge",
      "name": "Blending sponge",
      "category": "sponge",
      "tags": [
        "latex-free"
      ],
      "cost": 8,
      "quantity": 3,
      "condition": "fair"
    }
  ]
}
