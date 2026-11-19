import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "kids-party-vendor-compare-mcp",
  "title": "Kids Party Vendor Compare Audit",
  "description": "Kids Party Vendor Compare Audit: bounce magician and venue quote compare. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "party_vendor",
  "entity": "vendor",
  "categories": [
    {
      "id": "bounce",
      "label": "Bounce",
      "baseline": 4
    },
    {
      "id": "magic",
      "label": "Magic",
      "baseline": 3
    },
    {
      "id": "venue",
      "label": "Venues",
      "baseline": 3
    },
    {
      "id": "food",
      "label": "Food",
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
        "bounce"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "food"
      ]
    }
  ],
  "sample": [
    {
      "id": "party_vendor-sample-1",
      "name": "Sample bounce entry",
      "category": "bounce",
      "tags": [
        "party"
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
      "id": "party_vendor-sample-2",
      "name": "Sample magic entry",
      "category": "magic",
      "tags": [
        "party"
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
      "id": "party_vendor-sample-3",
      "name": "Sample venues entry",
      "category": "venue",
      "tags": [
        "party"
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
      "id": "party_vendor-sample-4",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "party"
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
