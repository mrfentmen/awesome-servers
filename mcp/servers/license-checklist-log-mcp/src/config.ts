import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "license-checklist-log-mcp",
  "title": "License Checklist Log Audit",
  "description": "License Checklist Log Audit: fishing and hunting license rules log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "license_log",
  "entity": "license",
  "categories": [
    {
      "id": "fishing",
      "label": "Fishing",
      "baseline": 4
    },
    {
      "id": "hunting",
      "label": "Hunting",
      "baseline": 3
    },
    {
      "id": "boat",
      "label": "Boating",
      "baseline": 3
    },
    {
      "id": "tags",
      "label": "Tags",
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
        "fishing"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "tags"
      ]
    }
  ],
  "sample": [
    {
      "id": "license_log-sample-1",
      "name": "Sample fishing entry",
      "category": "fishing",
      "tags": [
        "fishing"
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
      "id": "license_log-sample-2",
      "name": "Sample hunting entry",
      "category": "hunting",
      "tags": [
        "fishing"
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
      "id": "license_log-sample-3",
      "name": "Sample boating entry",
      "category": "boat",
      "tags": [
        "fishing"
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
      "id": "license_log-sample-4",
      "name": "Sample tags entry",
      "category": "tags",
      "tags": [
        "fishing"
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
