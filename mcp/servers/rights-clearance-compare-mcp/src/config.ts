import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rights-clearance-compare-mcp",
  "title": "rights clearance compare Compare",
  "description": "Real local JSON analysis of rights clearance compare in the Media & Publishing lane. 25 MCP tools, no paywall.",
  "prefix": "media_rights_clearance_compare",
  "entity": "rights clearance compare item",
  "categories": [
    {
      "id": "media",
      "label": "media",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "rights-clearance",
      "label": "rights-clearance",
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
      "id": "media_rights_clearance_compare-media-1",
      "name": "media primary",
      "category": "media",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-rights-clearance-3",
      "name": "rights-clearance primary",
      "category": "rights-clearance",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-media-5",
      "name": "media backup",
      "category": "media",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-rights-clearance-7",
      "name": "rights-clearance backup",
      "category": "rights-clearance",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
      "id": "media_rights_clearance_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "rights",
        "clearance"
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
