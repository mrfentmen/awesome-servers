import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "kids-online-compare-mcp",
  "title": "kids online compare Compare",
  "description": "Real local JSON analysis of kids online compare in the Security & Privacy lane. 25 MCP tools, no paywall.",
  "prefix": "sec_kids_online_compare",
  "entity": "kids online compare item",
  "categories": [
    {
      "id": "sec",
      "label": "sec",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "kids-online",
      "label": "kids-online",
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
        "sec"
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
      "id": "sec_kids_online_compare-sec-1",
      "name": "sec primary",
      "category": "sec",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-kids-online-3",
      "name": "kids-online primary",
      "category": "kids-online",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-sec-5",
      "name": "sec backup",
      "category": "sec",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-kids-online-7",
      "name": "kids-online backup",
      "category": "kids-online",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
      "id": "sec_kids_online_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "kids",
        "online"
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
