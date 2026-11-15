import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-runbook-gap-cost-mcp",
  "title": "Runbook Gap Budget Audit",
  "description": "Audit runbook gap budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "runbook_gap_budget",
  "entity": "runbook step budget line",
  "categories": [
    {
      "id": "detection",
      "label": "Detection",
      "baseline": 2
    },
    {
      "id": "diagnosis",
      "label": "Diagnosis",
      "baseline": 2
    },
    {
      "id": "remediation",
      "label": "Remediation",
      "baseline": 3
    },
    {
      "id": "rollback",
      "label": "Rollback",
      "baseline": 2
    },
    {
      "id": "verification",
      "label": "Verification",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "detection",
      "label": "Detection",
      "categories": [
        "detection"
      ]
    },
    {
      "id": "diagnosis",
      "label": "Diagnosis",
      "categories": [
        "diagnosis"
      ]
    },
    {
      "id": "remediation",
      "label": "Remediation",
      "categories": [
        "remediation"
      ]
    },
    {
      "id": "rollback",
      "label": "Rollback",
      "categories": [
        "rollback"
      ]
    },
    {
      "id": "verification",
      "label": "Verification",
      "categories": [
        "verification"
      ]
    }
  ],
  "sample": [
    {
      "id": "runbook_gap_budget-alert-coverage",
      "name": "Alert coverage",
      "category": "detection",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "runbook_gap_budget-diagnosis-tools",
      "name": "Diagnosis tools",
      "category": "diagnosis",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "runbook_gap_budget-remediation-scripts",
      "name": "Remediation scripts",
      "category": "remediation",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "runbook_gap_budget-rollback-rehearsal",
      "name": "Rollback rehearsal",
      "category": "rollback",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "runbook_gap_budget-verification-checklist",
      "name": "Verification checklist",
      "category": "verification",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
