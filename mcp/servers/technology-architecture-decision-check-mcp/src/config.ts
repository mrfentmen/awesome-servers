import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-architecture-decision-check-mcp",
  "title": "Architecture Decision Audit",
  "description": "Audit ADR context, decisions, consequences, alternatives and status for open questions and stale records. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "architecture_decision",
  "entity": "architecture decision",
  "categories": [
    {
      "id": "context",
      "label": "Context",
      "baseline": 2
    },
    {
      "id": "decision",
      "label": "Decision",
      "baseline": 2
    },
    {
      "id": "consequences",
      "label": "Consequences",
      "baseline": 2
    },
    {
      "id": "alternatives",
      "label": "Alternatives",
      "baseline": 2
    },
    {
      "id": "status",
      "label": "Status",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "open_questions",
    "label": "Open questions",
    "unit": "questions",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 800,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "context",
      "label": "Context",
      "categories": [
        "context"
      ]
    },
    {
      "id": "decision",
      "label": "Decision",
      "categories": [
        "decision"
      ]
    },
    {
      "id": "consequences",
      "label": "Consequences",
      "categories": [
        "consequences"
      ]
    },
    {
      "id": "alternatives",
      "label": "Alternatives",
      "categories": [
        "alternatives"
      ]
    },
    {
      "id": "status",
      "label": "Status",
      "categories": [
        "status"
      ]
    }
  ],
  "sample": [
    {
      "id": "architecture_decision-payments-service-boundary",
      "name": "Payments service boundary",
      "category": "context",
      "tags": [
        "context",
        "payments"
      ],
      "cost": 4,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision-event-bus-ownership",
      "name": "Event bus ownership",
      "category": "context",
      "tags": [
        "context",
        "events"
      ],
      "cost": 3,
      "quantity": 2,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "architecture_decision-adopt-postgresql",
      "name": "Adopt PostgreSQL",
      "category": "decision",
      "tags": [
        "decision",
        "database"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision-use-async-jobs",
      "name": "Use async jobs",
      "category": "decision",
      "tags": [
        "decision",
        "jobs"
      ],
      "cost": 2,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "architecture_decision-postgresql-operating-cost",
      "name": "PostgreSQL operating cost",
      "category": "consequences",
      "tags": [
        "consequence",
        "database"
      ],
      "cost": 2,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision-async-retry-complexity",
      "name": "Async retry complexity",
      "category": "consequences",
      "tags": [
        "consequence",
        "jobs"
      ],
      "cost": 3,
      "quantity": 2,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "architecture_decision-managed-queue-alternative",
      "name": "Managed queue alternative",
      "category": "alternatives",
      "tags": [
        "alternative",
        "queue"
      ],
      "cost": 2,
      "quantity": 1,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision-single-database-alternative",
      "name": "Single database alternative",
      "category": "alternatives",
      "tags": [
        "alternative",
        "database"
      ],
      "cost": 1,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision-adr-001-status",
      "name": "ADR-001 status",
      "category": "status",
      "tags": [
        "accepted"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    }
  ]
}
