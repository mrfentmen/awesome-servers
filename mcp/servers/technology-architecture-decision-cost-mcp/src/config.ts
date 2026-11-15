import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-architecture-decision-cost-mcp",
  "title": "Architecture Decision Budget Audit",
  "description": "Audit architecture decision budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "architecture_decision_budget",
  "entity": "architecture decision budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
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
      "id": "architecture_decision_budget-context-interviews",
      "name": "Context interviews",
      "category": "context",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "architecture_decision_budget-decision-workshop",
      "name": "Decision workshop",
      "category": "decision",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "architecture_decision_budget-consequence-review",
      "name": "Consequence review",
      "category": "consequences",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "architecture_decision_budget-alternative-spike",
      "name": "Alternative spike",
      "category": "alternatives",
      "tags": [
        "budget"
      ],
      "cost": 240,
      "quantity": 240,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "architecture_decision_budget-adr-maintenance",
      "name": "ADR maintenance",
      "category": "status",
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
