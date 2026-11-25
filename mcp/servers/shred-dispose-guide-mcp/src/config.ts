import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "shred-dispose-guide-mcp",
  "title": "shred dispose guide Guide",
  "description": "Real local JSON analysis of shred dispose guide in the Security & Privacy lane. 25 MCP tools, no paywall.",
  "prefix": "sec_shred_dispose_guide",
  "entity": "shred dispose guide item",
  "categories": [
    {
      "id": "sec",
      "label": "sec",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "shred-dispose",
      "label": "shred-dispose",
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
      "id": "sec_shred_dispose_guide-sec-1",
      "name": "sec primary",
      "category": "sec",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-shred-dispose-3",
      "name": "shred-dispose primary",
      "category": "shred-dispose",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-sec-5",
      "name": "sec backup",
      "category": "sec",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-shred-dispose-7",
      "name": "shred-dispose backup",
      "category": "shred-dispose",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
      "id": "sec_shred_dispose_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "shred",
        "dispose"
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
