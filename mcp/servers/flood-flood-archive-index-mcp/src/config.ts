import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-archive-index-mcp",
  "title": "Flood Archive Archive",
  "description": "Archive flood archive by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_archive_index",
  "entity": "archive record archive",
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
      "id": "flood_archive_index-before-photos",
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
      "id": "flood_archive_index-permits",
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
      "id": "flood_archive_index-receipts",
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
      "id": "flood_archive_index-timeline",
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
