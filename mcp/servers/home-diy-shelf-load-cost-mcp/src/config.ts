import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-shelf-load-cost-mcp",
  "title": "Shelf Load Budget Audit",
  "description": "Audit shelf load budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "shelf_load_budget",
  "entity": "shelf item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
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
      "id": "shelf_load_budget-oak-shelf",
      "name": "Oak shelf",
      "category": "shelf",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "shelf_load_budget-steel-bracket",
      "name": "Steel bracket",
      "category": "bracket",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "shelf_load_budget-wall-anchor",
      "name": "Wall anchor",
      "category": "anchor",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "new"
    },
    {
      "id": "shelf_load_budget-storage-box",
      "name": "Storage box",
      "category": "box",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    }
  ]
}
