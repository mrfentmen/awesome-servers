import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-log-anomaly-cost-mcp",
  "title": "Log Anomaly Budget Audit",
  "description": "Audit log anomaly budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "log_anomaly_budget",
  "entity": "log signal budget line",
  "categories": [
    {
      "id": "errors",
      "label": "Errors",
      "baseline": 3
    },
    {
      "id": "warnings",
      "label": "Warnings",
      "baseline": 2
    },
    {
      "id": "latency",
      "label": "Latency",
      "baseline": 2
    },
    {
      "id": "authentication",
      "label": "Authentication",
      "baseline": 2
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
    "budget": 450,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "errors",
      "label": "Errors",
      "categories": [
        "errors"
      ]
    },
    {
      "id": "warnings",
      "label": "Warnings",
      "categories": [
        "warnings"
      ]
    },
    {
      "id": "latency",
      "label": "Latency",
      "categories": [
        "latency"
      ]
    },
    {
      "id": "authentication",
      "label": "Authentication",
      "categories": [
        "authentication"
      ]
    }
  ],
  "sample": [
    {
      "id": "log_anomaly_budget-error-cleanup",
      "name": "Error cleanup",
      "category": "errors",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "log_anomaly_budget-warning-review",
      "name": "Warning review",
      "category": "warnings",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "log_anomaly_budget-latency-tracing",
      "name": "Latency tracing",
      "category": "latency",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "log_anomaly_budget-auth-audit",
      "name": "Auth audit",
      "category": "authentication",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
