import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-laptop-thermal-index-mcp",
  "title": "Laptop Thermal Archive",
  "description": "Archive laptop thermal by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "laptop_thermal_index",
  "entity": "thermal reading archive",
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
    "id": "peak_temp_c",
    "label": "Peak temperature",
    "unit": "C",
    "target": 85,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
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
      "id": "laptop_thermal_index-idle",
      "name": "Idle desktop",
      "category": "idle",
      "tags": [
        "baseline",
        "fan-off"
      ],
      "cost": 0,
      "quantity": 42,
      "condition": "good"
    },
    {
      "id": "laptop_thermal_index-browser",
      "name": "Browser with 30 tabs",
      "category": "browser",
      "tags": [
        "chrome",
        "fan-low"
      ],
      "cost": 0,
      "quantity": 58,
      "condition": "good"
    },
    {
      "id": "laptop_thermal_index-video",
      "name": "Video call",
      "category": "video",
      "tags": [
        "camera",
        "teams"
      ],
      "cost": 0,
      "quantity": 72,
      "condition": "fair"
    },
    {
      "id": "laptop_thermal_index-compile",
      "name": "Build compile",
      "category": "compile",
      "tags": [
        "cpu",
        "sustained"
      ],
      "cost": 0,
      "quantity": 91,
      "condition": "worn"
    },
    {
      "id": "laptop_thermal_index-gaming",
      "name": "Game session",
      "category": "gaming",
      "tags": [
        "gpu",
        "high"
      ],
      "cost": 0,
      "quantity": 88,
      "condition": "fair"
    },
    {
      "id": "laptop_thermal_index-pad",
      "name": "Cooling pad",
      "category": "cooling",
      "tags": [
        "usb",
        "fan"
      ],
      "cost": 35,
      "quantity": 65,
      "condition": "new"
    }
  ]
}
