import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "source-list-tracker-mcp",
  "title": "source list tracker Tracker",
  "description": "Real local JSON analysis of source list tracker in the Media & Publishing lane. 25 MCP tools, no paywall.",
  "prefix": "media_source_list_tracker",
  "entity": "source list tracker item",
  "categories": [
    {
      "id": "media",
      "label": "media",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "source-list",
      "label": "source-list",
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
    "label": "Days since activity",
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
      "id": "media_source_list_tracker-media-1",
      "name": "media primary",
      "category": "media",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-source-list-3",
      "name": "source-list primary",
      "category": "source-list",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-media-5",
      "name": "media backup",
      "category": "media",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-source-list-7",
      "name": "source-list backup",
      "category": "source-list",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
      "id": "media_source_list_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "source",
        "list"
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
