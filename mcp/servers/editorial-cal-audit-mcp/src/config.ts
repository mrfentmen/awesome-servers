import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "editorial-cal-audit-mcp",
  "title": "editorial cal audit Audit",
  "description": "Real local JSON analysis of editorial cal audit in the Media & Publishing lane. 25 MCP tools, no paywall.",
  "prefix": "media_editorial_cal_audit",
  "entity": "editorial cal audit item",
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
      "id": "editorial-cal",
      "label": "editorial-cal",
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
      "id": "media_editorial_cal_audit-media-1",
      "name": "media primary",
      "category": "media",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-editorial-cal-3",
      "name": "editorial-cal primary",
      "category": "editorial-cal",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-media-5",
      "name": "media backup",
      "category": "media",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-editorial-cal-7",
      "name": "editorial-cal backup",
      "category": "editorial-cal",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
      "id": "media_editorial_cal_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "editorial",
        "cal"
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
