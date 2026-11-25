import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "voter-info-compare-mcp",
  "title": "voter info compare Compare",
  "description": "Real local JSON analysis of voter info compare in the Local Government lane. 25 MCP tools, no paywall.",
  "prefix": "civic_voter_info_compare",
  "entity": "voter info compare item",
  "categories": [
    {
      "id": "civic",
      "label": "civic",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "voter-info",
      "label": "voter-info",
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
      "id": "civic_voter_info_compare-civic-1",
      "name": "civic primary",
      "category": "civic",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-voter-info-3",
      "name": "voter-info primary",
      "category": "voter-info",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-civic-5",
      "name": "civic backup",
      "category": "civic",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-voter-info-7",
      "name": "voter-info backup",
      "category": "voter-info",
      "tags": [
        "local-government",
        "voter",
        "info"
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
      "id": "civic_voter_info_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "local-government",
        "voter",
        "info"
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
