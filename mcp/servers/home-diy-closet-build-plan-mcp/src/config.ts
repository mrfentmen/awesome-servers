import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-closet-build-plan-mcp",
  "title": "Closet Build Planning Audit",
  "description": "Plan closet build by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "closet_build_plan",
  "entity": "closet part plan",
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
    "id": "load_rating_kg",
    "label": "Load rating",
    "unit": "kg",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
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
      "id": "closet_build_plan-stud",
      "name": "Wall stud",
      "category": "framing",
      "tags": [
        "wood",
        "structural"
      ],
      "cost": 8,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-bracket",
      "name": "Shelf bracket",
      "category": "framing",
      "tags": [
        "steel",
        "hidden"
      ],
      "cost": 12,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-shelf",
      "name": "Melamine shelf",
      "category": "shelving",
      "tags": [
        "white",
        "cut-to-size"
      ],
      "cost": 28,
      "quantity": 32,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-drawer",
      "name": "Drawer unit",
      "category": "shelving",
      "tags": [
        "soft-close",
        "stackable"
      ],
      "cost": 55,
      "quantity": 18,
      "condition": "fair"
    },
    {
      "id": "closet_build_plan-rod",
      "name": "Closet rod",
      "category": "rod",
      "tags": [
        "steel",
        "one-inch"
      ],
      "cost": 18,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-rod-support",
      "name": "Rod center support",
      "category": "rod",
      "tags": [
        "steel",
        "load"
      ],
      "cost": 9,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-screw",
      "name": "Wood screw pack",
      "category": "hardware",
      "tags": [
        "coarse",
        "black"
      ],
      "cost": 7,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-anchor",
      "name": "Drywall anchor pack",
      "category": "hardware",
      "tags": [
        "heavy-duty",
        "toggle"
      ],
      "cost": 11,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "closet_build_plan-paint",
      "name": "Shelf paint",
      "category": "finish",
      "tags": [
        "low-voc",
        "white"
      ],
      "cost": 24,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "closet_build_plan-edge",
      "name": "Edge banding",
      "category": "finish",
      "tags": [
        "iron-on",
        "white"
      ],
      "cost": 14,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
