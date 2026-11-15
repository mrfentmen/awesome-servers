import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-event-look-plan-mcp",
  "title": "Event Look Planning Audit",
  "description": "Plan event look by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "event_look_plan",
  "entity": "event look item plan",
  "categories": [
    {
      "id": "base",
      "label": "Base",
      "baseline": 1
    },
    {
      "id": "eye",
      "label": "Eyes",
      "baseline": 2
    },
    {
      "id": "lip",
      "label": "Lips",
      "baseline": 1
    },
    {
      "id": "cheek",
      "label": "Cheeks",
      "baseline": 1
    },
    {
      "id": "setting",
      "label": "Setting",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "look_readiness",
    "label": "Look readiness",
    "unit": "%",
    "target": 85,
    "direction": "higher"
  },
  "target": {
    "maxItems": 18,
    "budget": 400,
    "coverage": 0.8,
    "expiryDays": 180
  },
  "dependencies": [
    {
      "id": "complexion",
      "label": "Complexion",
      "categories": [
        "base"
      ]
    },
    {
      "id": "eyes",
      "label": "Eye look",
      "categories": [
        "eye"
      ]
    },
    {
      "id": "lips",
      "label": "Lip colour",
      "categories": [
        "lip"
      ]
    },
    {
      "id": "finish",
      "label": "Longwear finish",
      "categories": [
        "setting"
      ]
    }
  ],
  "sample": [
    {
      "id": "event_look_plan-foundation",
      "name": "Longwear foundation",
      "category": "base",
      "tags": [
        "longwear",
        "medium"
      ],
      "cost": 48,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "event_look_plan-mascara",
      "name": "Waterproof mascara",
      "category": "eye",
      "tags": [
        "waterproof",
        "black"
      ],
      "cost": 28,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "event_look_plan-palette",
      "name": "Smoky palette",
      "category": "eye",
      "tags": [
        "smoky",
        "evening"
      ],
      "cost": 45,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "event_look_plan-lipstick",
      "name": "Berry lipstick",
      "category": "lip",
      "tags": [
        "berry",
        "longwear"
      ],
      "cost": 32,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "event_look_plan-contour",
      "name": "Cream contour",
      "category": "cheek",
      "tags": [
        "sculpt",
        "cream"
      ],
      "cost": 30,
      "quantity": 65,
      "condition": "good"
    },
    {
      "id": "event_look_plan-spray",
      "name": "Setting spray",
      "category": "setting",
      "tags": [
        "longwear",
        "fine-mist"
      ],
      "cost": 26,
      "quantity": 75,
      "condition": "good"
    }
  ]
}
