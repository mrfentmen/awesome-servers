import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-maintenance-schedule-mcp",
  "title": "Home Maintenance Schedule Audit",
  "description": "Home Maintenance Schedule Audit: seasonal home tasks checklist and cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "home_maint",
  "entity": "task",
  "categories": [
    {
      "id": "spring",
      "label": "Spring",
      "baseline": 4
    },
    {
      "id": "summer",
      "label": "Summer",
      "baseline": 3
    },
    {
      "id": "fall",
      "label": "Fall",
      "baseline": 3
    },
    {
      "id": "winter",
      "label": "Winter",
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
        "spring"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "winter"
      ]
    }
  ],
  "sample": [
    {
      "id": "home_maint-sample-1",
      "name": "Sample spring entry",
      "category": "spring",
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
      "id": "home_maint-sample-2",
      "name": "Sample summer entry",
      "category": "summer",
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
      "id": "home_maint-sample-3",
      "name": "Sample fall entry",
      "category": "fall",
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
      "id": "home_maint-sample-4",
      "name": "Sample winter entry",
      "category": "winter",
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
