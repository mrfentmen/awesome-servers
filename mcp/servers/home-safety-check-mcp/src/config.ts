import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-safety-check-mcp",
  "title": "Home Safety Check Audit",
  "description": "Home Safety Check Audit: detector ladder and hazard checks. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "home_safety",
  "entity": "check",
  "categories": [
    {
      "id": "fire",
      "label": "Fire",
      "baseline": 4
    },
    {
      "id": "fall",
      "label": "Falls",
      "baseline": 3
    },
    {
      "id": "poison",
      "label": "Poisons",
      "baseline": 3
    },
    {
      "id": "entry",
      "label": "Entry",
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
        "fire"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "entry"
      ]
    }
  ],
  "sample": [
    {
      "id": "home_safety-sample-1",
      "name": "Sample fire entry",
      "category": "fire",
      "tags": [
        "home"
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
      "id": "home_safety-sample-2",
      "name": "Sample falls entry",
      "category": "fall",
      "tags": [
        "home"
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
      "id": "home_safety-sample-3",
      "name": "Sample poisons entry",
      "category": "poison",
      "tags": [
        "home"
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
      "id": "home_safety-sample-4",
      "name": "Sample entry entry",
      "category": "entry",
      "tags": [
        "home"
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
