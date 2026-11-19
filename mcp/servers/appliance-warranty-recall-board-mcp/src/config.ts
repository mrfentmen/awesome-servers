import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "appliance-warranty-recall-board-mcp",
  "title": "Appliance Warranty Recall Board Audit",
  "description": "Appliance Warranty Recall Board Audit: track appliance warranty and recall checks. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "appliance_wr",
  "entity": "appliance",
  "categories": [
    {
      "id": "kitchen",
      "label": "Kitchen",
      "baseline": 4
    },
    {
      "id": "laundry",
      "label": "Laundry",
      "baseline": 3
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 3
    },
    {
      "id": "small",
      "label": "Small appliances",
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
        "kitchen"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "small"
      ]
    }
  ],
  "sample": [
    {
      "id": "appliance_wr-sample-1",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "appliance"
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
      "id": "appliance_wr-sample-2",
      "name": "Sample laundry entry",
      "category": "laundry",
      "tags": [
        "appliance"
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
      "id": "appliance_wr-sample-3",
      "name": "Sample hvac entry",
      "category": "hvac",
      "tags": [
        "appliance"
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
      "id": "appliance_wr-sample-4",
      "name": "Sample small appliances entry",
      "category": "small",
      "tags": [
        "appliance"
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
