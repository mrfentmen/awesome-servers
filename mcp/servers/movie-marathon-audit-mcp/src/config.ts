import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "movie-marathon-audit-mcp",
  "title": "movie-marathon audit Audit",
  "description": "Real local JSON analysis of movie-marathon audit in the Entertainment & Gaming lane. 25 MCP tools, no paywall.",
  "prefix": "entertainment_movie_marathon_audit",
  "entity": "movie-marathon audit item",
  "categories": [
    {
      "id": "entertainment",
      "label": "entertainment",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "movie-marathon",
      "label": "movie-marathon",
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
        "entertainment"
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
      "id": "entertainment_movie_marathon_audit-entertainment-1",
      "name": "entertainment primary",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-movie-marathon-3",
      "name": "movie-marathon primary",
      "category": "movie-marathon",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-entertainment-5",
      "name": "entertainment backup",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-movie-marathon-7",
      "name": "movie-marathon backup",
      "category": "movie-marathon",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
      "id": "entertainment_movie_marathon_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "entertainment-gaming",
        "movie",
        "marathon"
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
