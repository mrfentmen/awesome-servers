import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-shelf-load-check-mcp",
  "title": "Shelf Load Audit",
  "description": "Audit shelves, brackets, anchors and boxes for load capacity and safety. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "shelf_load",
  "entity": "shelf item",
  "categories": [
    {
      "id": "shelf",
      "label": "Shelves",
      "baseline": 2
    },
    {
      "id": "bracket",
      "label": "Brackets",
      "baseline": 2
    },
    {
      "id": "anchor",
      "label": "Anchors",
      "baseline": 2
    },
    {
      "id": "box",
      "label": "Storage boxes",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Load capacity",
    "unit": "kg",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "shelf",
      "label": "Shelf",
      "categories": [
        "shelf"
      ]
    },
    {
      "id": "bracket",
      "label": "Bracket",
      "categories": [
        "bracket"
      ]
    },
    {
      "id": "anchor",
      "label": "Anchor",
      "categories": [
        "anchor"
      ]
    },
    {
      "id": "box",
      "label": "Storage box",
      "categories": [
        "box"
      ]
    }
  ],
  "sample": [
    {
      "id": "shelf-board",
      "name": "Oak shelf",
      "category": "shelf",
      "tags": [
        "wood"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "shelf-bracket",
      "name": "Steel bracket",
      "category": "bracket",
      "tags": [
        "steel"
      ],
      "cost": 15,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "shelf-anchor",
      "name": "Wall anchor",
      "category": "anchor",
      "tags": [
        "masonry"
      ],
      "cost": 5,
      "quantity": 35,
      "condition": "new"
    },
    {
      "id": "shelf-box",
      "name": "Storage box",
      "category": "box",
      "tags": [
        "plastic"
      ],
      "cost": 12,
      "quantity": 15,
      "condition": "fair"
    }
  ]
}
