import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-native-planting-check-mcp",
  "title": "Native Planting Audit",
  "description": "Audit native shrubs, perennials, grasses and trees for native share, coverage and planting gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "native_planting",
  "entity": "planting",
  "categories": [
    {
      "id": "shrub",
      "label": "Shrubs",
      "baseline": 3
    },
    {
      "id": "perennial",
      "label": "Perennials",
      "baseline": 4
    },
    {
      "id": "grass",
      "label": "Grasses",
      "baseline": 2
    },
    {
      "id": "tree",
      "label": "Trees",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "germination_rate",
    "label": "Native share",
    "unit": "%",
    "target": 60,
    "direction": "higher"
  },
  "target": {
    "maxItems": 25,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "shrub",
      "label": "Shrub layer",
      "categories": [
        "shrub"
      ]
    },
    {
      "id": "perennial",
      "label": "Perennial layer",
      "categories": [
        "perennial"
      ]
    },
    {
      "id": "grass",
      "label": "Grass layer",
      "categories": [
        "grass"
      ]
    },
    {
      "id": "tree",
      "label": "Canopy layer",
      "categories": [
        "tree"
      ]
    }
  ],
  "sample": [
    {
      "id": "native-shrub",
      "name": "Native shrub",
      "category": "shrub",
      "tags": [
        "evergreen"
      ],
      "cost": 25,
      "quantity": 70,
      "acquired": "2026-03-01",
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "native-perennial",
      "name": "Native perennial",
      "category": "perennial",
      "tags": [
        "pollinator"
      ],
      "cost": 12,
      "quantity": 55,
      "acquired": "2026-04-01",
      "expires": "2027-04-01",
      "condition": "good"
    },
    {
      "id": "native-grass",
      "name": "Native grass",
      "category": "grass",
      "tags": [
        "drought"
      ],
      "cost": 10,
      "quantity": 80,
      "acquired": "2026-05-01",
      "expires": "2027-05-01",
      "condition": "new"
    },
    {
      "id": "native-tree",
      "name": "Native tree sapling",
      "category": "tree",
      "tags": [
        "canopy"
      ],
      "cost": 40,
      "quantity": 40,
      "acquired": "2026-02-01",
      "expires": "2027-02-01",
      "condition": "fair"
    },
    {
      "id": "native-perennial-2",
      "name": "Native groundcover",
      "category": "perennial",
      "tags": [
        "groundcover"
      ],
      "cost": 8,
      "quantity": 65,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "good"
    }
  ]
}
