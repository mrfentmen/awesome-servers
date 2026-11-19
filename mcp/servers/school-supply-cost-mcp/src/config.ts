import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "school-supply-cost-mcp",
  "title": "School Supply Cost Audit",
  "description": "School Supply Cost Audit: supply list cost compare. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "school_supply",
  "entity": "supply",
  "categories": [
    {
      "id": "paper",
      "label": "Paper",
      "baseline": 4
    },
    {
      "id": "writing",
      "label": "Writing",
      "baseline": 3
    },
    {
      "id": "art",
      "label": "Art",
      "baseline": 3
    },
    {
      "id": "tech",
      "label": "Tech",
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
        "paper"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "tech"
      ]
    }
  ],
  "sample": [
    {
      "id": "school_supply-sample-1",
      "name": "Sample paper entry",
      "category": "paper",
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
      "id": "school_supply-sample-2",
      "name": "Sample writing entry",
      "category": "writing",
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
      "id": "school_supply-sample-3",
      "name": "Sample art entry",
      "category": "art",
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
      "id": "school_supply-sample-4",
      "name": "Sample tech entry",
      "category": "tech",
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
