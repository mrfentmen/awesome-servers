import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-runbook-gap-check-mcp",
  "title": "Runbook Gap Audit",
  "description": "Audit detection, diagnosis, remediation, rollback and verification steps for operational gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "runbook_gap",
  "entity": "runbook step",
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
    "id": "gap_count",
    "label": "Gap count",
    "unit": "gaps",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
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
      "id": "runbook_gap-high-error-rate-alert",
      "name": "High error rate alert",
      "category": "detection",
      "tags": [
        "alert",
        "errors"
      ],
      "cost": 1,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "runbook_gap-queue-backlog-alert",
      "name": "Queue backlog alert",
      "category": "detection",
      "tags": [
        "alert",
        "queue"
      ],
      "cost": 1,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "runbook_gap-trace-lookup",
      "name": "Trace lookup",
      "category": "diagnosis",
      "tags": [
        "trace",
        "diagnosis"
      ],
      "cost": 2,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "runbook_gap-dependency-health-check",
      "name": "Dependency health check",
      "category": "diagnosis",
      "tags": [
        "dependency"
      ],
      "cost": 1,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "runbook_gap-restart-worker",
      "name": "Restart worker",
      "category": "remediation",
      "tags": [
        "restart",
        "worker"
      ],
      "cost": 3,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "runbook_gap-scale-queue-consumers",
      "name": "Scale queue consumers",
      "category": "remediation",
      "tags": [
        "scale",
        "queue"
      ],
      "cost": 2,
      "quantity": 2,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    },
    {
      "id": "runbook_gap-purge-poison-message",
      "name": "Purge poison message",
      "category": "remediation",
      "tags": [
        "queue",
        "poison"
      ],
      "cost": 1,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "runbook_gap-rollback-deployment",
      "name": "Rollback deployment",
      "category": "rollback",
      "tags": [
        "deploy",
        "rollback"
      ],
      "cost": 2,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "runbook_gap-restore-previous-config",
      "name": "Restore previous config",
      "category": "rollback",
      "tags": [
        "config",
        "rollback"
      ],
      "cost": 1,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "runbook_gap-verify-error-budget",
      "name": "Verify error budget",
      "category": "verification",
      "tags": [
        "slo"
      ],
      "cost": 1,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
