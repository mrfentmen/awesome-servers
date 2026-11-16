import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-closet-build-cost-mcp",
  "title": "Closet Build Budget Audit",
  "description": "Audit closet build budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "closet_build_budget",
  "entity": "closet part budget line",
  "categories": [
    {
      "id": "framing",
      "label": "Framing",
      "baseline": 2
    },
    {
      "id": "shelving",
      "label": "Shelving",
      "baseline": 3
    },
    {
      "id": "rod",
      "label": "Rods",
      "baseline": 2
    },
    {
      "id": "hardware",
      "label": "Hardware",
      "baseline": 3
    },
    {
      "id": "finish",
      "label": "Finish",
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
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "frame",
      "label": "Wall framing",
      "categories": [
        "framing"
      ]
    },
    {
      "id": "shelf",
      "label": "Shelf support",
      "categories": [
        "shelving"
      ]
    },
    {
      "id": "hang",
      "label": "Hanging storage",
      "categories": [
        "rod"
      ]
    },
    {
      "id": "fasten",
      "label": "Fasteners",
      "categories": [
        "hardware"
      ]
    },
    {
      "id": "finish",
      "label": "Finish coat",
      "categories": [
        "finish"
      ]
    }
  ],
  "sample": [
    {
      "id": "closet_build_budget-wall-stud",
      "name": "Wall stud",
      "category": "framing",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-shelf-bracket",
      "name": "Shelf bracket",
      "category": "framing",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-melamine-shelf",
      "name": "Melamine shelf",
      "category": "shelving",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-drawer-unit",
      "name": "Drawer unit",
      "category": "shelving",
      "tags": [
        "budget"
      ],
      "cost": 55,
      "quantity": 55,
      "condition": "fair"
    },
    {
      "id": "closet_build_budget-closet-rod",
      "name": "Closet rod",
      "category": "rod",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-rod-center-support",
      "name": "Rod center support",
      "category": "rod",
      "tags": [
        "budget"
      ],
      "cost": 9,
      "quantity": 9,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-wood-screw-pack",
      "name": "Wood screw pack",
      "category": "hardware",
      "tags": [
        "budget"
      ],
      "cost": 7,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-drywall-anchor-pack",
      "name": "Drywall anchor pack",
      "category": "hardware",
      "tags": [
        "budget"
      ],
      "cost": 11,
      "quantity": 11,
      "condition": "fair"
    },
    {
      "id": "closet_build_budget-shelf-paint",
      "name": "Shelf paint",
      "category": "finish",
      "tags": [
        "budget"
      ],
      "cost": 24,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "closet_build_budget-edge-banding",
      "name": "Edge banding",
      "category": "finish",
      "tags": [
        "budget"
      ],
      "cost": 14,
      "quantity": 14,
      "condition": "good"
    }
  ]
}
