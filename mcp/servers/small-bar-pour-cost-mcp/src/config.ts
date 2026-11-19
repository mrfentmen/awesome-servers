import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-bar-pour-cost-mcp",
  "title": "Small Bar Pour Cost Audit",
  "description": "Small Bar Pour Cost Audit: cost out bottles pours waste and margins. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pour_cost",
  "entity": "bottle",
  "categories": [
    {
      "id": "spirits",
      "label": "Spirits",
      "baseline": 4
    },
    {
      "id": "mixers",
      "label": "Mixers",
      "baseline": 3
    },
    {
      "id": "garnish",
      "label": "Garnish",
      "baseline": 3
    },
    {
      "id": "supplies",
      "label": "Supplies",
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
        "spirits"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "pour_cost-sample-1",
      "name": "Sample spirits entry",
      "category": "spirits",
      "tags": [
        "bar"
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
      "id": "pour_cost-sample-2",
      "name": "Sample mixers entry",
      "category": "mixers",
      "tags": [
        "bar"
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
      "id": "pour_cost-sample-3",
      "name": "Sample garnish entry",
      "category": "garnish",
      "tags": [
        "bar"
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
      "id": "pour_cost-sample-4",
      "name": "Sample supplies entry",
      "category": "supplies",
      "tags": [
        "bar"
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
