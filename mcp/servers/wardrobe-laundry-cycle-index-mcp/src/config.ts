import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-laundry-cycle-index-mcp",
  "title": "Laundry Cycle Archive",
  "description": "Archive laundry cycle by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "laundry_cycle_index",
  "entity": "laundry item archive",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 4
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 3
    },
    {
      "id": "underwear",
      "label": "Underwear",
      "baseline": 6
    },
    {
      "id": "activewear",
      "label": "Activewear",
      "baseline": 3
    },
    {
      "id": "towel",
      "label": "Towels",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "wear_interval",
    "label": "Wear interval",
    "unit": "wears",
    "target": 2,
    "direction": "higher"
  },
  "target": {
    "maxItems": 24,
    "budget": 120,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lights",
      "label": "Light wash",
      "categories": [
        "top"
      ]
    },
    {
      "id": "darks",
      "label": "Dark wash",
      "categories": [
        "bottom"
      ]
    },
    {
      "id": "hygiene",
      "label": "Hygiene wash",
      "categories": [
        "underwear"
      ]
    },
    {
      "id": "towels",
      "label": "Towel load",
      "categories": [
        "towel"
      ]
    }
  ],
  "sample": [
    {
      "id": "laundry_cycle_index-tee",
      "name": "Cotton tee",
      "category": "top",
      "tags": [
        "cotton",
        "light"
      ],
      "cost": 25,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_index-shirt",
      "name": "Work shirt",
      "category": "top",
      "tags": [
        "cotton",
        "light"
      ],
      "cost": 60,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_index-jeans",
      "name": "Denim jeans",
      "category": "bottom",
      "tags": [
        "denim",
        "dark"
      ],
      "cost": 80,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_index-leggings",
      "name": "Training leggings",
      "category": "activewear",
      "tags": [
        "synthetic",
        "cold"
      ],
      "cost": 45,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "laundry_cycle_index-socks",
      "name": "Cotton socks",
      "category": "underwear",
      "tags": [
        "cotton",
        "hot"
      ],
      "cost": 12,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_index-towel",
      "name": "Bath towel",
      "category": "towel",
      "tags": [
        "cotton",
        "hot"
      ],
      "cost": 30,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
