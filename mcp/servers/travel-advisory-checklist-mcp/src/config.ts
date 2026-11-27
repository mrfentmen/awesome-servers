import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-advisory-checklist-mcp",
  "title": "travel advisory checklist Checklist",
  "description": "Real local JSON analysis of travel advisory checklist in the Immigration & Documents lane. 25 MCP tools, no paywall.",
  "prefix": "imm_travel_advisory_checklist",
  "entity": "travel advisory checklist item",
  "categories": [
    {
      "id": "imm",
      "label": "imm",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "travel-advisory",
      "label": "travel-advisory",
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
      "id": "imm_travel_advisory_checklist-imm-1",
      "name": "imm primary",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-travel-advisory-3",
      "name": "travel-advisory primary",
      "category": "travel-advisory",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-imm-5",
      "name": "imm backup",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-travel-advisory-7",
      "name": "travel-advisory backup",
      "category": "travel-advisory",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
      "id": "imm_travel_advisory_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "travel",
        "advisory"
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
