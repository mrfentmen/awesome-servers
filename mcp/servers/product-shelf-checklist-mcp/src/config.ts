import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "product-shelf-checklist-mcp",
  "title": "product shelf checklist Checklist",
  "description": "Real local JSON analysis of product shelf checklist in the Beauty & Body lane. 25 MCP tools, no paywall.",
  "prefix": "beauty_product_shelf_checklist",
  "entity": "product shelf checklist item",
  "categories": [
    {
      "id": "beauty",
      "label": "beauty",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "product-shelf",
      "label": "product-shelf",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "beauty"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "beauty_product_shelf_checklist-beauty-1",
      "name": "beauty primary",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-product-shelf-3",
      "name": "product-shelf primary",
      "category": "product-shelf",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-beauty-5",
      "name": "beauty backup",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-product-shelf-7",
      "name": "product-shelf backup",
      "category": "product-shelf",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_product_shelf_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "product",
        "shelf"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
