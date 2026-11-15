import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-reactivity-sim-mcp",
  "title": "Dog Reactivity Simulator",
  "description": "Simulate dog reactivity by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_reactivity_sim",
  "entity": "reactivity trigger simulation",
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
      "id": "dog_reactivity_sim-dog",
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
      "id": "dog_reactivity_sim-person",
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
      "id": "dog_reactivity_sim-traffic",
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
      "id": "dog_reactivity_sim-thunder",
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
      "id": "dog_reactivity_sim-harness",
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
      "id": "dog_reactivity_sim-treats",
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
