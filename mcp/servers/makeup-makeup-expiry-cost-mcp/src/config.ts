import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-makeup-expiry-cost-mcp",
  "title": "Makeup Expiry Budget Audit",
  "description": "Audit makeup expiry budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "makeup_expiry_budget",
  "entity": "makeup item budget line",
  "categories": [
    {
      "id": "base",
      "label": "Base products",
      "baseline": 3
    },
    {
      "id": "eye",
      "label": "Eye products",
      "baseline": 4
    },
    {
      "id": "lip",
      "label": "Lip products",
      "baseline": 4
    },
    {
      "id": "cheek",
      "label": "Cheek products",
      "baseline": 3
    },
    {
      "id": "tool",
      "label": "Tools",
      "baseline": 5
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
      "id": "base",
      "label": "Base makeup",
      "categories": [
        "base"
      ]
    },
    {
      "id": "eye",
      "label": "Eye makeup",
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
      "id": "tool",
      "label": "Application tools",
      "categories": [
        "tool"
      ]
    }
  ],
  "sample": [
    {
      "id": "makeup_expiry_budget-liquid-foundation",
      "name": "Liquid foundation",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "makeup_expiry_budget-volumizing-mascara",
      "name": "Volumizing mascara",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "makeup_expiry_budget-red-lipstick",
      "name": "Red lipstick",
      "category": "lip",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "makeup_expiry_budget-cream-blush",
      "name": "Cream blush",
      "category": "cheek",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "makeup_expiry_budget-foundation-brush",
      "name": "Foundation brush",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "makeup_expiry_budget-liquid-concealer",
      "name": "Liquid concealer",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "fair"
    }
  ]
}
