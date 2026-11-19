import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "allergen-menu-scan-mcp",
  "title": "Allergen Menu Scan Audit",
  "description": "Allergen Menu Scan Audit: flag allergens in pasted menu text. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "allergen_scan",
  "entity": "menu item",
  "categories": [
    {
      "id": "mains",
      "label": "Mains",
      "baseline": 4
    },
    {
      "id": "sides",
      "label": "Sides",
      "baseline": 3
    },
    {
      "id": "dessert",
      "label": "Desserts",
      "baseline": 3
    },
    {
      "id": "drinks",
      "label": "Drinks",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "mains"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "drinks"
      ]
    }
  ],
  "sample": [
    {
      "id": "allergen_scan-sample-1",
      "name": "Sample mains entry",
      "category": "mains",
      "tags": [
        "allergen"
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
      "id": "allergen_scan-sample-2",
      "name": "Sample sides entry",
      "category": "sides",
      "tags": [
        "allergen"
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
      "id": "allergen_scan-sample-3",
      "name": "Sample desserts entry",
      "category": "dessert",
      "tags": [
        "allergen"
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
      "id": "allergen_scan-sample-4",
      "name": "Sample drinks entry",
      "category": "drinks",
      "tags": [
        "allergen"
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
