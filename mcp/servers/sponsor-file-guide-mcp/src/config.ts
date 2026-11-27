import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sponsor-file-guide-mcp",
  "title": "sponsor file guide Guide",
  "description": "Real local JSON analysis of sponsor file guide in the Immigration & Documents lane. 25 MCP tools, no paywall.",
  "prefix": "imm_sponsor_file_guide",
  "entity": "sponsor file guide item",
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
      "id": "sponsor-file",
      "label": "sponsor-file",
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
      "id": "imm_sponsor_file_guide-imm-1",
      "name": "imm primary",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-sponsor-file-3",
      "name": "sponsor-file primary",
      "category": "sponsor-file",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-imm-5",
      "name": "imm backup",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-sponsor-file-7",
      "name": "sponsor-file backup",
      "category": "sponsor-file",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
      "id": "imm_sponsor_file_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "sponsor",
        "file"
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
