import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "emergency-kit-expiry-audit-mcp",
  "title": "Emergency Kit Expiry Audit",
  "description": "Emergency Kit Expiry Audit: audit kit food water battery and med expiry. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "emergency_kit",
  "entity": "kit item",
  "categories": [
    {
      "id": "food",
      "label": "Food",
      "baseline": 4
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 3
    },
    {
      "id": "power",
      "label": "Power",
      "baseline": 3
    },
    {
      "id": "med",
      "label": "Meds",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "food"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "med"
      ]
    }
  ],
  "sample": [
    {
      "id": "emergency_kit-sample-1",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "emergency"
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
      "id": "emergency_kit-sample-2",
      "name": "Sample water entry",
      "category": "water",
      "tags": [
        "emergency"
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
      "id": "emergency_kit-sample-3",
      "name": "Sample power entry",
      "category": "power",
      "tags": [
        "emergency"
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
      "id": "emergency_kit-sample-4",
      "name": "Sample meds entry",
      "category": "med",
      "tags": [
        "emergency"
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
