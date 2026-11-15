import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-multi-cat-match-mcp",
  "title": "Multi-Cat Tension Match Audit",
  "description": "Match multi-cat tension by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "multi_cat_match",
  "entity": "multi-cat resource match",
  "categories": [
    {
      "id": "food",
      "label": "Feeding",
      "baseline": 2
    },
    {
      "id": "litter",
      "label": "Litter",
      "baseline": 2
    },
    {
      "id": "perch",
      "label": "Perches",
      "baseline": 1
    },
    {
      "id": "play",
      "label": "Play",
      "baseline": 1
    },
    {
      "id": "separation",
      "label": "Separation",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "conflict_events",
    "label": "Conflict events",
    "unit": "events",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 24,
    "budget": 400,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "feeding",
      "label": "Feeding stations",
      "categories": [
        "food"
      ]
    },
    {
      "id": "elimination",
      "label": "Litter stations",
      "categories": [
        "litter"
      ]
    },
    {
      "id": "vertical",
      "label": "Vertical space",
      "categories": [
        "perch"
      ]
    },
    {
      "id": "play",
      "label": "Shared play",
      "categories": [
        "play"
      ]
    },
    {
      "id": "retreat",
      "label": "Retreat space",
      "categories": [
        "separation"
      ]
    }
  ],
  "sample": [
    {
      "id": "multi_cat_match-food",
      "name": "Separate feeding station",
      "category": "food",
      "tags": [
        "separated",
        "timed"
      ],
      "cost": 30,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "multi_cat_match-litter1",
      "name": "Litter box one",
      "category": "litter",
      "tags": [
        "covered",
        "daily"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "multi_cat_match-litter2",
      "name": "Litter box two",
      "category": "litter",
      "tags": [
        "open",
        "far-away"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "multi_cat_match-tree",
      "name": "Shared cat tree",
      "category": "perch",
      "tags": [
        "two-platforms",
        "escape"
      ],
      "cost": 120,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "multi_cat_match-wand",
      "name": "Group wand play",
      "category": "play",
      "tags": [
        "daily",
        "separate-turns"
      ],
      "cost": 8,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "multi_cat_match-gate",
      "name": "Separation gate",
      "category": "separation",
      "tags": [
        "mesh",
        "feeding"
      ],
      "cost": 40,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
