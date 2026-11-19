import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "storage-unit-inventory-cost-mcp",
  "title": "Storage Unit Inventory Cost Audit",
  "description": "Storage Unit Inventory Cost Audit: unit inventory and monthly cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "storage_unit",
  "entity": "box",
  "categories": [
    {
      "id": "furniture",
      "label": "Furniture",
      "baseline": 4
    },
    {
      "id": "boxes",
      "label": "Boxes",
      "baseline": 3
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 3
    },
    {
      "id": "seasonal",
      "label": "Seasonal",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 25,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "furniture"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "seasonal"
      ]
    }
  ],
  "sample": [
    {
      "id": "storage_unit-sample-1",
      "name": "Sample furniture entry",
      "category": "furniture",
      "tags": [
        "storage"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "storage_unit-sample-2",
      "name": "Sample boxes entry",
      "category": "boxes",
      "tags": [
        "storage"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "storage_unit-sample-3",
      "name": "Sample tools entry",
      "category": "tools",
      "tags": [
        "storage"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "storage_unit-sample-4",
      "name": "Sample seasonal entry",
      "category": "seasonal",
      "tags": [
        "storage"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
