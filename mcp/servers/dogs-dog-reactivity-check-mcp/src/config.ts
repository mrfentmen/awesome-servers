import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-reactivity-check-mcp",
  "title": "Dog Reactivity Audit",
  "description": "Audit dog reactivity by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_reactivity",
  "entity": "reactivity trigger",
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
    "id": "reaction_score",
    "label": "Reaction score",
    "unit": "score",
    "target": 3,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
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
      "id": "dog_reactivity-dog",
      "name": "On-leash dog",
      "category": "dog",
      "tags": [
        "distance-10m",
        "barking"
      ],
      "cost": 0,
      "quantity": 7,
      "condition": "worn"
    },
    {
      "id": "dog_reactivity-person",
      "name": "Runner",
      "category": "person",
      "tags": [
        "approach",
        "jumping"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "fair"
    },
    {
      "id": "dog_reactivity-traffic",
      "name": "Delivery van",
      "category": "traffic",
      "tags": [
        "street",
        "noise"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "fair"
    },
    {
      "id": "dog_reactivity-thunder",
      "name": "Thunder",
      "category": "noise",
      "tags": [
        "storm",
        "pacing"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "worn"
    },
    {
      "id": "dog_reactivity-harness",
      "name": "Harness handling",
      "category": "handling",
      "tags": [
        "touch",
        "calm"
      ],
      "cost": 45,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "dog_reactivity-treats",
      "name": "High-value treats",
      "category": "handling",
      "tags": [
        "counter-conditioning"
      ],
      "cost": 12,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
