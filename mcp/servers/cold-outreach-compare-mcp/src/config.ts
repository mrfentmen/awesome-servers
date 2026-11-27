import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cold-outreach-compare-mcp",
  "title": "cold outreach compare Compare",
  "description": "Real local JSON analysis of cold outreach compare in the Marketing & Sales lane. 25 MCP tools, no paywall.",
  "prefix": "mkt_cold_outreach_compare",
  "entity": "cold outreach compare item",
  "categories": [
    {
      "id": "mkt",
      "label": "mkt",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "cold-outreach",
      "label": "cold-outreach",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "mkt"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "mkt_cold_outreach_compare-mkt-1",
      "name": "mkt primary",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-cold-outreach-3",
      "name": "cold-outreach primary",
      "category": "cold-outreach",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-mkt-5",
      "name": "mkt backup",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-cold-outreach-7",
      "name": "cold-outreach backup",
      "category": "cold-outreach",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "mkt_cold_outreach_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "cold",
        "outreach"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
