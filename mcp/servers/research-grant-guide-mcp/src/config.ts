import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "research-grant-guide-mcp",
  "title": "research grant guide Guide",
  "description": "Real local JSON analysis of research grant guide in the Universities lane. 25 MCP tools, no paywall.",
  "prefix": "highered_research_grant_guide",
  "entity": "research grant guide item",
  "categories": [
    {
      "id": "highered",
      "label": "highered",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "research-grant",
      "label": "research-grant",
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
        "highered"
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
      "id": "highered_research_grant_guide-highered-1",
      "name": "highered primary",
      "category": "highered",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-research-grant-3",
      "name": "research-grant primary",
      "category": "research-grant",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-highered-5",
      "name": "highered backup",
      "category": "highered",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-research-grant-7",
      "name": "research-grant backup",
      "category": "research-grant",
      "tags": [
        "universities",
        "research",
        "grant"
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
      "id": "highered_research_grant_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "universities",
        "research",
        "grant"
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
