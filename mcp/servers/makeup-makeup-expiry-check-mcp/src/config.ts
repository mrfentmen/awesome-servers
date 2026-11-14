import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-makeup-expiry-check-mcp",
  "title": "Makeup Expiry Audit",
  "description": "Track makeup expiry dates, days remaining, category coverage and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "makeup_expiry",
  "entity": "makeup item",
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
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 30
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
      "id": "makeup-foundation",
      "name": "Liquid foundation",
      "category": "base",
      "tags": [
        "liquid"
      ],
      "cost": 45,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-06-01",
      "condition": "good"
    },
    {
      "id": "makeup-mascara",
      "name": "Volumizing mascara",
      "category": "eye",
      "tags": [
        "black"
      ],
      "cost": 25,
      "quantity": 1,
      "acquired": "2026-02-01",
      "expires": "2027-01-01",
      "condition": "good"
    },
    {
      "id": "makeup-lipstick",
      "name": "Red lipstick",
      "category": "lip",
      "tags": [
        "red"
      ],
      "cost": 30,
      "quantity": 1,
      "acquired": "2025-10-01",
      "expires": "2028-01-01",
      "condition": "new"
    },
    {
      "id": "makeup-blush",
      "name": "Cream blush",
      "category": "cheek",
      "tags": [
        "peach"
      ],
      "cost": 35,
      "quantity": 1,
      "acquired": "2025-12-01",
      "expires": "2026-12-10",
      "condition": "good"
    },
    {
      "id": "makeup-brush",
      "name": "Foundation brush",
      "category": "tool",
      "tags": [
        "synthetic"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2024-05-01",
      "expires": "2030-01-01",
      "condition": "good"
    },
    {
      "id": "makeup-concealer",
      "name": "Liquid concealer",
      "category": "base",
      "tags": [
        "liquid"
      ],
      "cost": 28,
      "quantity": 1,
      "acquired": "2025-01-01",
      "expires": "2025-10-01",
      "condition": "fair"
    }
  ]
}
