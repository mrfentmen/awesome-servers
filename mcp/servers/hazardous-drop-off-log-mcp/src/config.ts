import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "hazardous-drop-off-log-mcp",
  "title": "Hazardous Drop Off Log Audit",
  "description": "Hazardous Drop Off Log Audit: paint med sharps ewaste tire site log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hazard_drop",
  "entity": "drop item",
  "categories": [
    {
      "id": "paint",
      "label": "Paint",
      "baseline": 4
    },
    {
      "id": "meds",
      "label": "Meds",
      "baseline": 3
    },
    {
      "id": "ewaste",
      "label": "E-waste",
      "baseline": 3
    },
    {
      "id": "tires",
      "label": "Tires",
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
        "paint"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "tires"
      ]
    }
  ],
  "sample": [
    {
      "id": "hazard_drop-sample-1",
      "name": "Sample paint entry",
      "category": "paint",
      "tags": [
        "hazardous"
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
      "id": "hazard_drop-sample-2",
      "name": "Sample meds entry",
      "category": "meds",
      "tags": [
        "hazardous"
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
      "id": "hazard_drop-sample-3",
      "name": "Sample e-waste entry",
      "category": "ewaste",
      "tags": [
        "hazardous"
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
      "id": "hazard_drop-sample-4",
      "name": "Sample tires entry",
      "category": "tires",
      "tags": [
        "hazardous"
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
