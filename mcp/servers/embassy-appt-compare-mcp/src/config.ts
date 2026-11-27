import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "embassy-appt-compare-mcp",
  "title": "embassy appt compare Compare",
  "description": "Real local JSON analysis of embassy appt compare in the Immigration & Documents lane. 25 MCP tools, no paywall.",
  "prefix": "imm_embassy_appt_compare",
  "entity": "embassy appt compare item",
  "categories": [
    {
      "id": "imm",
      "label": "imm",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "embassy-appt",
      "label": "embassy-appt",
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
      "id": "imm_embassy_appt_compare-imm-1",
      "name": "imm primary",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-embassy-appt-3",
      "name": "embassy-appt primary",
      "category": "embassy-appt",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-imm-5",
      "name": "imm backup",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-embassy-appt-7",
      "name": "embassy-appt backup",
      "category": "embassy-appt",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
      "id": "imm_embassy_appt_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "embassy",
        "appt"
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
