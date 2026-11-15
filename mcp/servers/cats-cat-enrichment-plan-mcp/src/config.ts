import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-cat-enrichment-plan-mcp",
  "title": "Cat Enrichment Planning Audit",
  "description": "Plan cat enrichment by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cat_enrichment_plan",
  "entity": "enrichment item plan",
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
    "id": "daily_minutes",
    "label": "Daily enrichment",
    "unit": "min",
    "target": 45,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
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
      "id": "cat_enrichment_plan-tree",
      "name": "Tall cat tree",
      "category": "vertical",
      "tags": [
        "3-levels",
        "stable"
      ],
      "cost": 120,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_plan-scratcher",
      "name": "Sisal scratcher",
      "category": "scratch",
      "tags": [
        "vertical",
        "floor"
      ],
      "cost": 35,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_plan-feeder",
      "name": "Puzzle feeder",
      "category": "hunt",
      "tags": [
        "slow",
        "dry-food"
      ],
      "cost": 25,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_plan-wand",
      "name": "Wand toy",
      "category": "play",
      "tags": [
        "interactive",
        "daily"
      ],
      "cost": 8,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "cat_enrichment_plan-window",
      "name": "Window perch",
      "category": "sensory",
      "tags": [
        "sun",
        "birds"
      ],
      "cost": 45,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "cat_enrichment_plan-tunnel",
      "name": "Play tunnel",
      "category": "play",
      "tags": [
        "collapsible",
        "chase"
      ],
      "cost": 20,
      "quantity": 5,
      "condition": "fair"
    }
  ]
}
