import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "debt-credit-report-dispute-check-mcp",
  "title": "Credit Report Dispute Audit",
  "description": "Audit credit report dispute by item, reason, evidence, status coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "debt_credit_report_dispute",
  "entity": "credit report dispute item",
  "categories": [
    {
      "id": "item",
      "label": "Item",
      "baseline": 2
    },
    {
      "id": "reason",
      "label": "Reason",
      "baseline": 2
    },
    {
      "id": "evidence",
      "label": "Evidence",
      "baseline": 2
    },
    {
      "id": "status",
      "label": "Status",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 30,
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
        "item"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "status"
      ]
    }
  ],
  "sample": [
    {
      "id": "debt_credit_report_dispute-item-1",
      "name": "Item primary",
      "category": "item",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-reason-2",
      "name": "Reason primary",
      "category": "reason",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-evidence-3",
      "name": "Evidence primary",
      "category": "evidence",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-status-4",
      "name": "Status primary",
      "category": "status",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-item-5",
      "name": "Item backup",
      "category": "item",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-reason-6",
      "name": "Reason backup",
      "category": "reason",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-evidence-7",
      "name": "Evidence backup",
      "category": "evidence",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "debt_credit_report_dispute-status-8",
      "name": "Status backup",
      "category": "status",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
