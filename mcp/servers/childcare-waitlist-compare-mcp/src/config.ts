import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "childcare-waitlist-compare-mcp",
  "title": "Childcare Waitlist Compare Audit",
  "description": "Childcare Waitlist Compare Audit: compare provider waitlists deposits and terms. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "childcare_wl",
  "entity": "provider",
  "categories": [
    {
      "id": "center",
      "label": "Centers",
      "baseline": 4
    },
    {
      "id": "home",
      "label": "Home care",
      "baseline": 3
    },
    {
      "id": "nanny",
      "label": "Nannies",
      "baseline": 3
    },
    {
      "id": "afterschool",
      "label": "After school",
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
        "center"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "afterschool"
      ]
    }
  ],
  "sample": [
    {
      "id": "childcare_wl-sample-1",
      "name": "Sample centers entry",
      "category": "center",
      "tags": [
        "childcare"
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
      "id": "childcare_wl-sample-2",
      "name": "Sample home care entry",
      "category": "home",
      "tags": [
        "childcare"
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
      "id": "childcare_wl-sample-3",
      "name": "Sample nannies entry",
      "category": "nanny",
      "tags": [
        "childcare"
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
      "id": "childcare_wl-sample-4",
      "name": "Sample after school entry",
      "category": "afterschool",
      "tags": [
        "childcare"
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
