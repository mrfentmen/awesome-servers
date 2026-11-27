import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "doc-translate-tracker-mcp",
  "title": "doc translate tracker Tracker",
  "description": "Real local JSON analysis of doc translate tracker in the Immigration & Documents lane. 25 MCP tools, no paywall.",
  "prefix": "imm_doc_translate_tracker",
  "entity": "doc translate tracker item",
  "categories": [
    {
      "id": "imm",
      "label": "imm",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "doc-translate",
      "label": "doc-translate",
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
      "id": "imm_doc_translate_tracker-imm-1",
      "name": "imm primary",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-doc-translate-3",
      "name": "doc-translate primary",
      "category": "doc-translate",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-imm-5",
      "name": "imm backup",
      "category": "imm",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-doc-translate-7",
      "name": "doc-translate backup",
      "category": "doc-translate",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
      "id": "imm_doc_translate_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "immigration-documents",
        "doc",
        "translate"
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
