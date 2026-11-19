import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "burn-permit-check-mcp",
  "title": "Burn Permit Check Audit",
  "description": "Burn Permit Check Audit: multi-area burn permit checklist. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "burn_permit",
  "entity": "permit",
  "categories": [
    {
      "id": "yard",
      "label": "Yard waste",
      "baseline": 4
    },
    {
      "id": "bonfire",
      "label": "Bonfires",
      "baseline": 3
    },
    {
      "id": "ag",
      "label": "Ag burns",
      "baseline": 3
    },
    {
      "id": "rules",
      "label": "Rules",
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
        "yard"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "rules"
      ]
    }
  ],
  "sample": [
    {
      "id": "burn_permit-sample-1",
      "name": "Sample yard waste entry",
      "category": "yard",
      "tags": [
        "burn"
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
      "id": "burn_permit-sample-2",
      "name": "Sample bonfires entry",
      "category": "bonfire",
      "tags": [
        "burn"
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
      "id": "burn_permit-sample-3",
      "name": "Sample ag burns entry",
      "category": "ag",
      "tags": [
        "burn"
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
      "id": "burn_permit-sample-4",
      "name": "Sample rules entry",
      "category": "rules",
      "tags": [
        "burn"
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
