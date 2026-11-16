import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-basketball-shot-cost-mcp",
  "title": "Basketball Shot Budget Audit",
  "description": "Audit basketball shot budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basketball_shot_budget",
  "entity": "shot type budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
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
      "id": "basketball_shot_budget-free-throw",
      "name": "Free throw",
      "category": "free-throw",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "basketball_shot_budget-pressure-free-throw",
      "name": "Pressure free throw",
      "category": "free-throw",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_budget-pull-up-jumper",
      "name": "Pull-up jumper",
      "category": "mid-range",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "basketball_shot_budget-catch-and-shoot-mid",
      "name": "Catch-and-shoot mid",
      "category": "mid-range",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "basketball_shot_budget-corner-three",
      "name": "Corner three",
      "category": "three-point",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "basketball_shot_budget-wing-three",
      "name": "Wing three",
      "category": "three-point",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_budget-step-back-three",
      "name": "Step-back three",
      "category": "three-point",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "basketball_shot_budget-right-layup",
      "name": "Right layup",
      "category": "layup",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "basketball_shot_budget-left-layup",
      "name": "Left layup",
      "category": "layup",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "basketball_shot_budget-late-game-shooting",
      "name": "Late-game shooting",
      "category": "conditioning",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
