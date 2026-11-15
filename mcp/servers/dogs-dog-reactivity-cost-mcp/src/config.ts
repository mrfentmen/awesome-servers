import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-reactivity-cost-mcp",
  "title": "Dog Reactivity Budget Audit",
  "description": "Audit dog reactivity budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_reactivity_budget",
  "entity": "reactivity trigger budget line",
  "categories": [
    {
      "id": "dog",
      "label": "Other dogs",
      "baseline": 1
    },
    {
      "id": "person",
      "label": "People",
      "baseline": 1
    },
    {
      "id": "traffic",
      "label": "Traffic",
      "baseline": 1
    },
    {
      "id": "noise",
      "label": "Noise",
      "baseline": 1
    },
    {
      "id": "handling",
      "label": "Handling",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "animals",
      "label": "Dog triggers",
      "categories": [
        "dog"
      ]
    },
    {
      "id": "people",
      "label": "People triggers",
      "categories": [
        "person"
      ]
    },
    {
      "id": "environment",
      "label": "Environment triggers",
      "categories": [
        "traffic",
        "noise"
      ]
    },
    {
      "id": "handling",
      "label": "Handling plan",
      "categories": [
        "handling"
      ]
    }
  ],
  "sample": [
    {
      "id": "dog_reactivity_budget-on-leash-dog",
      "name": "On-leash dog",
      "category": "dog",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "dog_reactivity_budget-runner",
      "name": "Runner",
      "category": "person",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "dog_reactivity_budget-delivery-van",
      "name": "Delivery van",
      "category": "traffic",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "dog_reactivity_budget-thunder",
      "name": "Thunder",
      "category": "noise",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "dog_reactivity_budget-harness-handling",
      "name": "Harness handling",
      "category": "handling",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "dog_reactivity_budget-high-value-treats",
      "name": "High-value treats",
      "category": "handling",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "new"
    }
  ]
}
