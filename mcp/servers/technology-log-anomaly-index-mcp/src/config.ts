import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-log-anomaly-index-mcp",
  "title": "Log Anomaly Archive",
  "description": "Archive log anomaly by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "log_anomaly_index",
  "entity": "log signal archive",
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
    "id": "occurrences",
    "label": "Occurrences",
    "unit": "events",
    "target": 5,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
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
      "id": "log_anomaly_index-checkout-timeout",
      "name": "checkout timeout",
      "category": "errors",
      "tags": [
        "error",
        "checkout"
      ],
      "cost": 4,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "log_anomaly_index-payment-gateway-502",
      "name": "payment gateway 502",
      "category": "errors",
      "tags": [
        "error",
        "payments"
      ],
      "cost": 6,
      "quantity": 8,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    },
    {
      "id": "log_anomaly_index-retry-storm",
      "name": "retry storm",
      "category": "warnings",
      "tags": [
        "warning",
        "retry"
      ],
      "cost": 3,
      "quantity": 4,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "log_anomaly_index-deprecated-endpoint",
      "name": "deprecated endpoint",
      "category": "warnings",
      "tags": [
        "warning",
        "api"
      ],
      "cost": 1,
      "quantity": 2,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "log_anomaly_index-p95-checkout-latency",
      "name": "p95 checkout latency",
      "category": "latency",
      "tags": [
        "latency",
        "checkout"
      ],
      "cost": 5,
      "quantity": 7,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "log_anomaly_index-database-pool-wait",
      "name": "database pool wait",
      "category": "latency",
      "tags": [
        "latency",
        "database"
      ],
      "cost": 4,
      "quantity": 3,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "log_anomaly_index-failed-login-burst",
      "name": "failed login burst",
      "category": "authentication",
      "tags": [
        "auth",
        "login"
      ],
      "cost": 2,
      "quantity": 9,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    },
    {
      "id": "log_anomaly_index-token-refresh-failure",
      "name": "token refresh failure",
      "category": "authentication",
      "tags": [
        "auth",
        "token"
      ],
      "cost": 2,
      "quantity": 2,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
