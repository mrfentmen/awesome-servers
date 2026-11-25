import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "freelance-gig-compare-mcp",
  "title": "freelance gig compare Compare",
  "description": "Real local JSON analysis of freelance gig compare in the Work & Trades lane. 25 MCP tools, no paywall.",
  "prefix": "work_freelance_gig_compare",
  "entity": "freelance gig compare item",
  "categories": [
    {
      "id": "work",
      "label": "work",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "freelance-gig",
      "label": "freelance-gig",
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
        "work"
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
      "id": "work_freelance_gig_compare-work-1",
      "name": "work primary",
      "category": "work",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-freelance-gig-3",
      "name": "freelance-gig primary",
      "category": "freelance-gig",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-work-5",
      "name": "work backup",
      "category": "work",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-freelance-gig-7",
      "name": "freelance-gig backup",
      "category": "freelance-gig",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
      "id": "work_freelance_gig_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "work-trades",
        "freelance",
        "gig"
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
