import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-barrier-repair-sim-mcp",
  "title": "Barrier Repair Simulator",
  "description": "Simulate barrier repair by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "barrier_repair_sim",
  "entity": "barrier product simulation",
  "categories": [
    {
      "id": "cleanser",
      "label": "Cleansers",
      "baseline": 1
    },
    {
      "id": "ceramide",
      "label": "Ceramides",
      "baseline": 1
    },
    {
      "id": "humectant",
      "label": "Humectants",
      "baseline": 1
    },
    {
      "id": "occlusive",
      "label": "Occlusives",
      "baseline": 2
    },
    {
      "id": "spf",
      "label": "SPF",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "barrier_score",
    "label": "Barrier score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 10,
    "budget": 220,
    "coverage": 0.8,
    "expiryDays": 180
  },
  "dependencies": [
    {
      "id": "cleanse",
      "label": "Gentle cleansing",
      "categories": [
        "cleanser"
      ]
    },
    {
      "id": "lipid",
      "label": "Lipid repair",
      "categories": [
        "ceramide"
      ]
    },
    {
      "id": "hydrate",
      "label": "Hydration",
      "categories": [
        "humectant"
      ]
    },
    {
      "id": "protect",
      "label": "Sun protection",
      "categories": [
        "spf"
      ]
    }
  ],
  "sample": [
    {
      "id": "barrier_repair_sim-cleanser",
      "name": "Cream cleanser",
      "category": "cleanser",
      "tags": [
        "fragrance-free",
        "gentle"
      ],
      "cost": 24,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "barrier_repair_sim-ceramide",
      "name": "Ceramide cream",
      "category": "ceramide",
      "tags": [
        "ceramide",
        "night"
      ],
      "cost": 32,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "barrier_repair_sim-hyaluronic",
      "name": "Hyaluronic serum",
      "category": "humectant",
      "tags": [
        "hydration",
        "daily"
      ],
      "cost": 28,
      "quantity": 78,
      "condition": "good"
    },
    {
      "id": "barrier_repair_sim-squalane",
      "name": "Squalane oil",
      "category": "occlusive",
      "tags": [
        "plant",
        "night"
      ],
      "cost": 26,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "barrier_repair_sim-spf",
      "name": "SPF 40",
      "category": "spf",
      "tags": [
        "mineral",
        "daily"
      ],
      "cost": 30,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "barrier_repair_sim-balm",
      "name": "Night balm",
      "category": "occlusive",
      "tags": [
        "occlusive",
        "night"
      ],
      "cost": 34,
      "quantity": 65,
      "condition": "good"
    }
  ]
}
