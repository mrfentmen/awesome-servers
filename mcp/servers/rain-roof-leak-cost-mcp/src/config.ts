import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-roof-leak-cost-mcp",
  "title": "Roof Leak Budget Audit",
  "description": "Audit roof leak budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roof_leak_budget",
  "entity": "roof leak item budget line",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "gutter",
      "label": "Gutter",
      "baseline": 1
    },
    {
      "id": "flashing",
      "label": "Flashing",
      "baseline": 1
    },
    {
      "id": "ceiling",
      "label": "Ceiling",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "roof",
      "label": "Roof",
      "categories": [
        "roof"
      ]
    },
    {
      "id": "gutter",
      "label": "Gutter",
      "categories": [
        "gutter"
      ]
    },
    {
      "id": "flashing",
      "label": "Flashing",
      "categories": [
        "flashing"
      ]
    },
    {
      "id": "ceiling",
      "label": "Ceiling",
      "categories": [
        "ceiling"
      ]
    }
  ],
  "sample": [
    {
      "id": "roof_leak_budget-shingle-repair",
      "name": "Shingle repair",
      "category": "roof",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "roof_leak_budget-gutter-cleaning",
      "name": "Gutter cleaning",
      "category": "gutter",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "roof_leak_budget-flashing-repair",
      "name": "Flashing repair",
      "category": "flashing",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "roof_leak_budget-ceiling-repair",
      "name": "Ceiling repair",
      "category": "ceiling",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    }
  ]
}
