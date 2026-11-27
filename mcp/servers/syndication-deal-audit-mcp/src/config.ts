import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "syndication-deal-audit-mcp",
  "title": "syndication deal audit Audit",
  "description": "Real local JSON analysis of syndication deal audit in the Media & Publishing lane. 25 MCP tools, no paywall.",
  "prefix": "media_syndication_deal_audit",
  "entity": "syndication deal audit item",
  "categories": [
    {
      "id": "media",
      "label": "media",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "syndication-deal",
      "label": "syndication-deal",
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
    "target": 7,
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
        "media"
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
      "id": "media_syndication_deal_audit-media-1",
      "name": "media primary",
      "category": "media",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-syndication-deal-3",
      "name": "syndication-deal primary",
      "category": "syndication-deal",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-media-5",
      "name": "media backup",
      "category": "media",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-syndication-deal-7",
      "name": "syndication-deal backup",
      "category": "syndication-deal",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
      "id": "media_syndication_deal_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "syndication",
        "deal"
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
