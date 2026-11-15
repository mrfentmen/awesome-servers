import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-archive-cost-mcp",
  "title": "Flood Archive Budget Audit",
  "description": "Audit flood archive budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_archive_budget",
  "entity": "archive record budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
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
      "id": "flood_archive_budget-photo-archive",
      "name": "Photo archive",
      "category": "photos",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "flood_archive_budget-permit-copies",
      "name": "Permit copies",
      "category": "permits",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "flood_archive_budget-receipt-scanner",
      "name": "Receipt scanner",
      "category": "receipts",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "flood_archive_budget-timeline-setup",
      "name": "Timeline setup",
      "category": "timeline",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
