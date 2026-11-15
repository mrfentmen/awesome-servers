import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-archive-check-mcp",
  "title": "Flood Archive Audit",
  "description": "Audit flood photos, permits, receipts and timeline records. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_archive",
  "entity": "archive record",
  "categories": [
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "permits",
      "label": "Permits",
      "baseline": 1
    },
    {
      "id": "receipts",
      "label": "Receipts",
      "baseline": 1
    },
    {
      "id": "timeline",
      "label": "Timeline",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "record_count",
    "label": "Records",
    "unit": "records",
    "target": 10,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "photos",
      "label": "Photos",
      "categories": [
        "photos"
      ]
    },
    {
      "id": "permits",
      "label": "Permits",
      "categories": [
        "permits"
      ]
    },
    {
      "id": "receipts",
      "label": "Receipts",
      "categories": [
        "receipts"
      ]
    },
    {
      "id": "timeline",
      "label": "Timeline",
      "categories": [
        "timeline"
      ]
    }
  ],
  "sample": [
    {
      "id": "flood_archive-before-photos",
      "name": "Before photos",
      "category": "photos",
      "tags": [
        "photos"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "flood_archive-permits",
      "name": "Permits",
      "category": "permits",
      "tags": [
        "permits"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "flood_archive-receipts",
      "name": "Receipts",
      "category": "receipts",
      "tags": [
        "receipts"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "flood_archive-timeline",
      "name": "Timeline",
      "category": "timeline",
      "tags": [
        "timeline"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
