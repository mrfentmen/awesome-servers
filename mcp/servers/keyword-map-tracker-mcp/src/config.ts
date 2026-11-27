import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "keyword-map-tracker-mcp",
  "title": "keyword map tracker Tracker",
  "description": "Real local JSON analysis of keyword map tracker in the Marketing & Sales lane. 25 MCP tools, no paywall.",
  "prefix": "mkt_keyword_map_tracker",
  "entity": "keyword map tracker item",
  "categories": [
    {
      "id": "mkt",
      "label": "mkt",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "keyword-map",
      "label": "keyword-map",
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
      "id": "mkt_keyword_map_tracker-mkt-1",
      "name": "mkt primary",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-keyword-map-3",
      "name": "keyword-map primary",
      "category": "keyword-map",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-mkt-5",
      "name": "mkt backup",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-keyword-map-7",
      "name": "keyword-map backup",
      "category": "keyword-map",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
      "id": "mkt_keyword_map_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "keyword",
        "map"
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
