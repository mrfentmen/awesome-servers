import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-vinyl-care-check-mcp",
  "title": "Vinyl Care Audit",
  "description": "Audit records, sleeves, brushes and styli for play grade and care coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "vinyl_care",
  "entity": "vinyl item",
  "categories": [
    {
      "id": "record",
      "label": "Records",
      "baseline": 3
    },
    {
      "id": "sleeve",
      "label": "Sleeves",
      "baseline": 2
    },
    {
      "id": "brush",
      "label": "Brushes",
      "baseline": 1
    },
    {
      "id": "stylus",
      "label": "Styli",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Play grade",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "record",
      "label": "Record",
      "categories": [
        "record"
      ]
    },
    {
      "id": "sleeve",
      "label": "Sleeve",
      "categories": [
        "sleeve"
      ]
    },
    {
      "id": "brush",
      "label": "Brush",
      "categories": [
        "brush"
      ]
    },
    {
      "id": "stylus",
      "label": "Stylus",
      "categories": [
        "stylus"
      ]
    }
  ],
  "sample": [
    {
      "id": "vinyl-record",
      "name": "Vintage LP",
      "category": "record",
      "tags": [
        "jazz"
      ],
      "cost": 30,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "vinyl-sleeve",
      "name": "Inner sleeve",
      "category": "sleeve",
      "tags": [
        "paper"
      ],
      "cost": 2,
      "quantity": 70,
      "condition": "fair"
    },
    {
      "id": "vinyl-brush",
      "name": "Carbon brush",
      "category": "brush",
      "tags": [
        "anti-static"
      ],
      "cost": 20,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "vinyl-stylus",
      "name": "Replacement stylus",
      "category": "stylus",
      "tags": [
        "elliptical"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    }
  ]
}
