import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "member-care-compare-mcp",
  "title": "member care compare Compare",
  "description": "Real local JSON analysis of member care compare in the Faith & Community Ops lane. 25 MCP tools, no paywall.",
  "prefix": "faith_member_care_compare",
  "entity": "member care compare item",
  "categories": [
    {
      "id": "faith",
      "label": "faith",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "member-care",
      "label": "member-care",
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
        "faith"
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
      "id": "faith_member_care_compare-faith-1",
      "name": "faith primary",
      "category": "faith",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-member-care-3",
      "name": "member-care primary",
      "category": "member-care",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-faith-5",
      "name": "faith backup",
      "category": "faith",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-member-care-7",
      "name": "member-care backup",
      "category": "member-care",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
      "id": "faith_member_care_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "faith-community-ops",
        "member",
        "care"
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
