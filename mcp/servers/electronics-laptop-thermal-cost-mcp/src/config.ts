import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-laptop-thermal-cost-mcp",
  "title": "Laptop Thermal Budget Audit",
  "description": "Audit laptop thermal budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "laptop_thermal_budget",
  "entity": "thermal reading budget line",
  "categories": [
    {
      "id": "idle",
      "label": "Idle",
      "baseline": 1
    },
    {
      "id": "browser",
      "label": "Browser",
      "baseline": 1
    },
    {
      "id": "video",
      "label": "Video",
      "baseline": 1
    },
    {
      "id": "compile",
      "label": "Compile",
      "baseline": 1
    },
    {
      "id": "gaming",
      "label": "Gaming",
      "baseline": 1
    },
    {
      "id": "cooling",
      "label": "Cooling",
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
    "budget": 50,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "idle",
      "label": "Idle baseline",
      "categories": [
        "idle"
      ]
    },
    {
      "id": "light",
      "label": "Light load",
      "categories": [
        "browser",
        "video"
      ]
    },
    {
      "id": "sustained",
      "label": "Sustained load",
      "categories": [
        "compile",
        "gaming"
      ]
    },
    {
      "id": "cooling",
      "label": "Cooling support",
      "categories": [
        "cooling"
      ]
    }
  ],
  "sample": [
    {
      "id": "laptop_thermal_budget-idle-desktop",
      "name": "Idle desktop",
      "category": "idle",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "laptop_thermal_budget-browser-with-30-tabs",
      "name": "Browser with 30 tabs",
      "category": "browser",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "laptop_thermal_budget-video-call",
      "name": "Video call",
      "category": "video",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "laptop_thermal_budget-build-compile",
      "name": "Build compile",
      "category": "compile",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "laptop_thermal_budget-game-session",
      "name": "Game session",
      "category": "gaming",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "laptop_thermal_budget-cooling-pad",
      "name": "Cooling pad",
      "category": "cooling",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "new"
    }
  ]
}
