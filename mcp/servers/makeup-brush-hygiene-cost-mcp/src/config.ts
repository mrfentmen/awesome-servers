import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-brush-hygiene-cost-mcp",
  "title": "Brush Hygiene Budget Audit",
  "description": "Audit brush hygiene budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "brush_hygiene_budget",
  "entity": "makeup tool budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
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
      "id": "brush_hygiene_budget-foundation-brush",
      "name": "Foundation brush",
      "category": "face",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_budget-powder-brush",
      "name": "Powder brush",
      "category": "face",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "brush_hygiene_budget-shadow-brush",
      "name": "Shadow brush",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_budget-liner-brush",
      "name": "Liner brush",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "worn"
    },
    {
      "id": "brush_hygiene_budget-lip-brush",
      "name": "Lip brush",
      "category": "lip",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "brush_hygiene_budget-blending-sponge",
      "name": "Blending sponge",
      "category": "sponge",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "fair"
    }
  ]
}
