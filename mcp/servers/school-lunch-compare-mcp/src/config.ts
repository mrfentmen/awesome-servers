import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "school-lunch-compare-mcp",
  "title": "School Lunch Compare Audit",
  "description": "School Lunch Compare Audit: compare school lunch menus and prices across districts. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "school_lunch",
  "entity": "menu",
  "categories": [
    {
      "id": "hot",
      "label": "Hot lunch",
      "baseline": 4
    },
    {
      "id": "cold",
      "label": "Cold lunch",
      "baseline": 3
    },
    {
      "id": "snack",
      "label": "Snacks",
      "baseline": 3
    },
    {
      "id": "drink",
      "label": "Drinks",
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
        "hot"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "drink"
      ]
    }
  ],
  "sample": [
    {
      "id": "school_lunch-sample-1",
      "name": "Sample hot lunch entry",
      "category": "hot",
      "tags": [
        "school"
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
      "id": "school_lunch-sample-2",
      "name": "Sample cold lunch entry",
      "category": "cold",
      "tags": [
        "school"
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
      "id": "school_lunch-sample-3",
      "name": "Sample snacks entry",
      "category": "snack",
      "tags": [
        "school"
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
      "id": "school_lunch-sample-4",
      "name": "Sample drinks entry",
      "category": "drink",
      "tags": [
        "school"
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
