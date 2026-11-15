import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-cat-enrichment-cost-mcp",
  "title": "Cat Enrichment Budget Audit",
  "description": "Audit cat enrichment budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cat_enrichment_budget",
  "entity": "enrichment item budget line",
  "categories": [
    {
      "id": "vertical",
      "label": "Vertical space",
      "baseline": 1
    },
    {
      "id": "scratch",
      "label": "Scratching",
      "baseline": 1
    },
    {
      "id": "hunt",
      "label": "Foraging",
      "baseline": 1
    },
    {
      "id": "play",
      "label": "Play",
      "baseline": 1
    },
    {
      "id": "sensory",
      "label": "Sensory",
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
    "budget": 350,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "climbing",
      "label": "Climbing",
      "categories": [
        "vertical"
      ]
    },
    {
      "id": "scratching",
      "label": "Scratching",
      "categories": [
        "scratch"
      ]
    },
    {
      "id": "foraging",
      "label": "Foraging",
      "categories": [
        "hunt"
      ]
    },
    {
      "id": "active_play",
      "label": "Active play",
      "categories": [
        "play"
      ]
    },
    {
      "id": "senses",
      "label": "Senses",
      "categories": [
        "sensory"
      ]
    }
  ],
  "sample": [
    {
      "id": "cat_enrichment_budget-tall-cat-tree",
      "name": "Tall cat tree",
      "category": "vertical",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_budget-sisal-scratcher",
      "name": "Sisal scratcher",
      "category": "scratch",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_budget-puzzle-feeder",
      "name": "Puzzle feeder",
      "category": "hunt",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_budget-wand-toy",
      "name": "Wand toy",
      "category": "play",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_budget-window-perch",
      "name": "Window perch",
      "category": "sensory",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "fair"
    },
    {
      "id": "cat_enrichment_budget-play-tunnel",
      "name": "Play tunnel",
      "category": "play",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "fair"
    }
  ]
}
