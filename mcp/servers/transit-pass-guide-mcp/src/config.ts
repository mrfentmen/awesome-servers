import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-pass-guide-mcp",
  "title": "transit pass guide Guide",
  "description": "Real local JSON analysis of transit pass guide in the Local Government lane. 25 MCP tools, no paywall.",
  "prefix": "civic_transit_pass_guide",
  "entity": "transit pass guide item",
  "categories": [
    {
      "id": "civic",
      "label": "civic",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "transit-pass",
      "label": "transit-pass",
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
        "civic"
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
      "id": "civic_transit_pass_guide-civic-1",
      "name": "civic primary",
      "category": "civic",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-transit-pass-3",
      "name": "transit-pass primary",
      "category": "transit-pass",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-civic-5",
      "name": "civic backup",
      "category": "civic",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-transit-pass-7",
      "name": "transit-pass backup",
      "category": "transit-pass",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
      "id": "civic_transit_pass_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "local-government",
        "transit",
        "pass"
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
