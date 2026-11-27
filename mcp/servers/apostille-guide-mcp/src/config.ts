import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "apostille-guide-mcp",
  "title": "apostille guide Guide",
  "description": "Real local JSON analysis of apostille guide in the Immigration & Documents lane. 25 MCP tools, no paywall.",
  "prefix": "imm_apostille_guide",
  "entity": "apostille guide item",
  "categories": [
    {
      "id": "imm",
      "label": "imm",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "apostille",
      "label": "apostille",
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
        "imm"
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
      "id": "imm_apostille_guide-imm-1",
      "name": "imm primary",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-apostille-3",
      "name": "apostille primary",
      "category": "apostille",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-imm-5",
      "name": "imm backup",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-apostille-7",
      "name": "apostille backup",
      "category": "apostille",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
      "id": "imm_apostille_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "apostille",
        "guide"
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
