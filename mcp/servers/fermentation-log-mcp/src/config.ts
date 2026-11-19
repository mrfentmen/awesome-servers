import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fermentation-log-mcp",
  "title": "Fermentation Log Audit",
  "description": "Fermentation Log Audit: kimchi sourdough yogurt batch log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ferment_log",
  "entity": "batch",
  "categories": [
    {
      "id": "kimchi",
      "label": "Kimchi",
      "baseline": 4
    },
    {
      "id": "sourdough",
      "label": "Sourdough",
      "baseline": 3
    },
    {
      "id": "yogurt",
      "label": "Yogurt",
      "baseline": 3
    },
    {
      "id": "kombucha",
      "label": "Kombucha",
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
        "kimchi"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "kombucha"
      ]
    }
  ],
  "sample": [
    {
      "id": "ferment_log-sample-1",
      "name": "Sample kimchi entry",
      "category": "kimchi",
      "tags": [
        "fermentation"
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
      "id": "ferment_log-sample-2",
      "name": "Sample sourdough entry",
      "category": "sourdough",
      "tags": [
        "fermentation"
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
      "id": "ferment_log-sample-3",
      "name": "Sample yogurt entry",
      "category": "yogurt",
      "tags": [
        "fermentation"
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
      "id": "ferment_log-sample-4",
      "name": "Sample kombucha entry",
      "category": "kombucha",
      "tags": [
        "fermentation"
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
