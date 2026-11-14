import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-litter-box-check-mcp",
  "title": "Litter Box Audit",
  "description": "Audit litter, boxes, scoops and deodorizer for expiry and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "litter_box",
  "entity": "litter item",
  "categories": [
    {
      "id": "litter",
      "label": "Litter",
      "baseline": 2
    },
    {
      "id": "box",
      "label": "Boxes",
      "baseline": 1
    },
    {
      "id": "scoop",
      "label": "Scoops",
      "baseline": 1
    },
    {
      "id": "deodorizer",
      "label": "Deodorizer",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 80,
    "coverage": 0.75,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "litter",
      "label": "Litter",
      "categories": [
        "litter"
      ]
    },
    {
      "id": "box",
      "label": "Box",
      "categories": [
        "box"
      ]
    },
    {
      "id": "scoop",
      "label": "Scoop",
      "categories": [
        "scoop"
      ]
    }
  ],
  "sample": [
    {
      "id": "litter-clump",
      "name": "Clumping litter",
      "category": "litter",
      "tags": [
        "unscented"
      ],
      "cost": 18,
      "quantity": 1,
      "expires": "2027-06-01",
      "condition": "new"
    },
    {
      "id": "litter-box",
      "name": "Open litter box",
      "category": "box",
      "tags": [
        "plastic"
      ],
      "cost": 25,
      "quantity": 1,
      "expires": "2030-01-01",
      "condition": "good"
    },
    {
      "id": "litter-scoop",
      "name": "Metal scoop",
      "category": "scoop",
      "tags": [
        "metal"
      ],
      "cost": 8,
      "quantity": 1,
      "expires": "2030-01-01",
      "condition": "good"
    },
    {
      "id": "litter-deodorizer",
      "name": "Odor absorber",
      "category": "deodorizer",
      "tags": [
        "charcoal"
      ],
      "cost": 6,
      "quantity": 1,
      "expires": "2025-12-01",
      "condition": "fair"
    }
  ]
}
