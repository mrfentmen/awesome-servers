import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-event-look-cost-mcp",
  "title": "Event Look Budget Audit",
  "description": "Audit event look budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "event_look_budget",
  "entity": "event look item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 0
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
      "id": "event_look_budget-longwear-foundation",
      "name": "Longwear foundation",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 48,
      "quantity": 48,
      "condition": "good"
    },
    {
      "id": "event_look_budget-waterproof-mascara",
      "name": "Waterproof mascara",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "event_look_budget-smoky-palette",
      "name": "Smoky palette",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "event_look_budget-berry-lipstick",
      "name": "Berry lipstick",
      "category": "lip",
      "tags": [
        "budget"
      ],
      "cost": 32,
      "quantity": 32,
      "condition": "good"
    },
    {
      "id": "event_look_budget-cream-contour",
      "name": "Cream contour",
      "category": "cheek",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "event_look_budget-setting-spray",
      "name": "Setting spray",
      "category": "setting",
      "tags": [
        "budget"
      ],
      "cost": 26,
      "quantity": 26,
      "condition": "good"
    }
  ]
}
