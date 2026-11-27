import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lead-score-audit-mcp",
  "title": "lead score audit Audit",
  "description": "Real local JSON analysis of lead score audit in the Marketing & Sales lane. 25 MCP tools, no paywall.",
  "prefix": "mkt_lead_score_audit",
  "entity": "lead score audit item",
  "categories": [
    {
      "id": "mkt",
      "label": "mkt",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "lead-score",
      "label": "lead-score",
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
      "id": "mkt_lead_score_audit-mkt-1",
      "name": "mkt primary",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-lead-score-3",
      "name": "lead-score primary",
      "category": "lead-score",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-mkt-5",
      "name": "mkt backup",
      "category": "mkt",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-lead-score-7",
      "name": "lead-score backup",
      "category": "lead-score",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
      "id": "mkt_lead_score_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "marketing-sales",
        "lead",
        "score"
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
