import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dorm-life-compare-mcp",
  "title": "dorm life compare Compare",
  "description": "Real local JSON analysis of dorm life compare in the Universities lane. 25 MCP tools, no paywall.",
  "prefix": "highered_dorm_life_compare",
  "entity": "dorm life compare item",
  "categories": [
    {
      "id": "highered",
      "label": "highered",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "dorm-life",
      "label": "dorm-life",
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
      "id": "highered_dorm_life_compare-highered-1",
      "name": "highered primary",
      "category": "highered",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-dorm-life-3",
      "name": "dorm-life primary",
      "category": "dorm-life",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-highered-5",
      "name": "highered backup",
      "category": "highered",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-dorm-life-7",
      "name": "dorm-life backup",
      "category": "dorm-life",
      "tags": [
        "universities",
        "dorm",
        "life"
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
      "id": "highered_dorm_life_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "universities",
        "dorm",
        "life"
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
