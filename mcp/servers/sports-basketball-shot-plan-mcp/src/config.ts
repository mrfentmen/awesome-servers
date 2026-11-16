import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-basketball-shot-plan-mcp",
  "title": "Basketball Shot Planning Audit",
  "description": "Plan basketball shot by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basketball_shot_plan",
  "entity": "shot type plan",
  "categories": [
    {
      "id": "free-throw",
      "label": "Free throws",
      "baseline": 2
    },
    {
      "id": "mid-range",
      "label": "Mid-range",
      "baseline": 2
    },
    {
      "id": "three-point",
      "label": "Three-point",
      "baseline": 3
    },
    {
      "id": "layup",
      "label": "Layups",
      "baseline": 2
    },
    {
      "id": "conditioning",
      "label": "Conditioning",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "make_rate_pct",
    "label": "Make rate",
    "unit": "%",
    "target": 60,
    "direction": "higher"
  },
  "target": {
    "maxItems": 18,
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "paint",
      "label": "Paint scoring",
      "categories": [
        "layup"
      ]
    },
    {
      "id": "mid",
      "label": "Mid-range game",
      "categories": [
        "mid-range"
      ]
    },
    {
      "id": "perimeter",
      "label": "Perimeter game",
      "categories": [
        "three-point"
      ]
    },
    {
      "id": "free",
      "label": "Free-throw routine",
      "categories": [
        "free-throw"
      ]
    },
    {
      "id": "conditioning",
      "label": "Late-game legs",
      "categories": [
        "conditioning"
      ]
    }
  ],
  "sample": [
    {
      "id": "basketball_shot_plan-free",
      "name": "Free throw",
      "category": "free-throw",
      "tags": [
        "routine",
        "game"
      ],
      "cost": 0,
      "quantity": 78,
      "condition": "good"
    },
    {
      "id": "basketball_shot_plan-free-pressure",
      "name": "Pressure free throw",
      "category": "free-throw",
      "tags": [
        "late-game",
        "routine"
      ],
      "cost": 0,
      "quantity": 66,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_plan-pullup",
      "name": "Pull-up jumper",
      "category": "mid-range",
      "tags": [
        "dribble",
        "elbow"
      ],
      "cost": 0,
      "quantity": 48,
      "condition": "good"
    },
    {
      "id": "basketball_shot_plan-catch-shoot",
      "name": "Catch-and-shoot mid",
      "category": "mid-range",
      "tags": [
        "catch",
        "wing"
      ],
      "cost": 0,
      "quantity": 54,
      "condition": "good"
    },
    {
      "id": "basketball_shot_plan-corner-three",
      "name": "Corner three",
      "category": "three-point",
      "tags": [
        "catch",
        "corner"
      ],
      "cost": 0,
      "quantity": 41,
      "condition": "good"
    },
    {
      "id": "basketball_shot_plan-wing-three",
      "name": "Wing three",
      "category": "three-point",
      "tags": [
        "catch",
        "wing"
      ],
      "cost": 0,
      "quantity": 37,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_plan-stepback",
      "name": "Step-back three",
      "category": "three-point",
      "tags": [
        "dribble",
        "top"
      ],
      "cost": 0,
      "quantity": 31,
      "condition": "worn"
    },
    {
      "id": "basketball_shot_plan-layup",
      "name": "Right layup",
      "category": "layup",
      "tags": [
        "close",
        "right"
      ],
      "cost": 0,
      "quantity": 82,
      "condition": "good"
    },
    {
      "id": "basketball_shot_plan-layup-left",
      "name": "Left layup",
      "category": "layup",
      "tags": [
        "close",
        "left"
      ],
      "cost": 0,
      "quantity": 64,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_plan-conditioning",
      "name": "Late-game shooting",
      "category": "conditioning",
      "tags": [
        "fatigue",
        "game"
      ],
      "cost": 0,
      "quantity": 52,
      "condition": "good"
    }
  ]
}
