import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-energy-waste-walkthrough-mcp",
  "title": "Home Energy Waste Walkthrough Audit",
  "description": "Home Energy Waste Walkthrough Audit: room by room energy waste checklist. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "energy_walk",
  "entity": "room",
  "categories": [
    {
      "id": "living",
      "label": "Living areas",
      "baseline": 4
    },
    {
      "id": "kitchen",
      "label": "Kitchen",
      "baseline": 3
    },
    {
      "id": "bed",
      "label": "Bedrooms",
      "baseline": 3
    },
    {
      "id": "utility",
      "label": "Utility",
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
        "living"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "utility"
      ]
    }
  ],
  "sample": [
    {
      "id": "energy_walk-sample-1",
      "name": "Sample living areas entry",
      "category": "living",
      "tags": [
        "energy"
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
      "id": "energy_walk-sample-2",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "energy"
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
      "id": "energy_walk-sample-3",
      "name": "Sample bedrooms entry",
      "category": "bed",
      "tags": [
        "energy"
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
      "id": "energy_walk-sample-4",
      "name": "Sample utility entry",
      "category": "utility",
      "tags": [
        "energy"
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
