import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-running-load-cost-mcp",
  "title": "Running Load Budget Audit",
  "description": "Audit running load budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "running_load_budget",
  "entity": "run budget line",
  "categories": [
    {
      "id": "easy",
      "label": "Easy runs",
      "baseline": 3
    },
    {
      "id": "tempo",
      "label": "Tempo runs",
      "baseline": 2
    },
    {
      "id": "long",
      "label": "Long runs",
      "baseline": 2
    },
    {
      "id": "recovery",
      "label": "Recovery runs",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "easy",
      "label": "Easy load",
      "categories": [
        "easy"
      ]
    },
    {
      "id": "tempo",
      "label": "Tempo load",
      "categories": [
        "tempo"
      ]
    },
    {
      "id": "long",
      "label": "Long load",
      "categories": [
        "long"
      ]
    },
    {
      "id": "recovery",
      "label": "Recovery",
      "categories": [
        "recovery"
      ]
    }
  ],
  "sample": [
    {
      "id": "running_load_budget-easy-zone-2-run",
      "name": "Easy zone 2 run",
      "category": "easy",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "running_load_budget-tempo-intervals",
      "name": "Tempo intervals",
      "category": "tempo",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "running_load_budget-long-run",
      "name": "Long run",
      "category": "long",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "running_load_budget-recovery-jog",
      "name": "Recovery jog",
      "category": "recovery",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
