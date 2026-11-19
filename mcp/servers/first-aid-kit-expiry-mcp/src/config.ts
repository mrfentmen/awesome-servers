import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "first-aid-kit-expiry-mcp",
  "title": "First Aid Kit Expiry Audit",
  "description": "First Aid Kit Expiry Audit: kit item expiry log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fa_kit",
  "entity": "item",
  "categories": [
    {
      "id": "wound",
      "label": "Wound",
      "baseline": 4
    },
    {
      "id": "meds",
      "label": "Meds",
      "baseline": 3
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 3
    },
    {
      "id": "guides",
      "label": "Guides",
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
        "wound"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "guides"
      ]
    }
  ],
  "sample": [
    {
      "id": "fa_kit-sample-1",
      "name": "Sample wound entry",
      "category": "wound",
      "tags": [
        "first-aid"
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
      "id": "fa_kit-sample-2",
      "name": "Sample meds entry",
      "category": "meds",
      "tags": [
        "first-aid"
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
      "id": "fa_kit-sample-3",
      "name": "Sample tools entry",
      "category": "tools",
      "tags": [
        "first-aid"
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
      "id": "fa_kit-sample-4",
      "name": "Sample guides entry",
      "category": "guides",
      "tags": [
        "first-aid"
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
