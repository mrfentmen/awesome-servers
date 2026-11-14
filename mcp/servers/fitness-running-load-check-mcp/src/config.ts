import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-running-load-check-mcp",
  "title": "Running Load Audit",
  "description": "Audit running sessions by minutes, category coverage, load balance and recovery gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "running_load",
  "entity": "run",
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
    "id": "service_gap",
    "label": "Session minutes",
    "unit": "minutes",
    "target": 45,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
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
      "id": "run-easy",
      "name": "Easy zone 2 run",
      "category": "easy",
      "tags": [
        "aerobic"
      ],
      "cost": 0,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "run-tempo",
      "name": "Tempo intervals",
      "category": "tempo",
      "tags": [
        "threshold"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "run-long",
      "name": "Long run",
      "category": "long",
      "tags": [
        "endurance"
      ],
      "cost": 0,
      "quantity": 90,
      "condition": "fair"
    },
    {
      "id": "run-recovery",
      "name": "Recovery jog",
      "category": "recovery",
      "tags": [
        "easy"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
