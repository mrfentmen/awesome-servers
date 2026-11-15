import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-patch-test-cost-mcp",
  "title": "Patch Test Budget Audit",
  "description": "Audit patch test budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "patch_test_budget",
  "entity": "tested product budget line",
  "categories": [
    {
      "id": "face",
      "label": "Face",
      "baseline": 2
    },
    {
      "id": "eye",
      "label": "Eye area",
      "baseline": 1
    },
    {
      "id": "lip",
      "label": "Lips",
      "baseline": 1
    },
    {
      "id": "body",
      "label": "Body",
      "baseline": 1
    },
    {
      "id": "tool",
      "label": "Test tools",
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
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "face",
      "label": "Face patch test",
      "categories": [
        "face"
      ]
    },
    {
      "id": "eye",
      "label": "Eye-area test",
      "categories": [
        "eye"
      ]
    },
    {
      "id": "lip",
      "label": "Lip test",
      "categories": [
        "lip"
      ]
    },
    {
      "id": "body",
      "label": "Body test",
      "categories": [
        "body"
      ]
    }
  ],
  "sample": [
    {
      "id": "patch_test_budget-new-serum",
      "name": "New serum",
      "category": "face",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "patch_test_budget-new-cleanser",
      "name": "New cleanser",
      "category": "face",
      "tags": [
        "budget"
      ],
      "cost": 22,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "patch_test_budget-eye-cream",
      "name": "Eye cream",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "fair"
    },
    {
      "id": "patch_test_budget-lip-balm",
      "name": "Lip balm",
      "category": "lip",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "patch_test_budget-body-lotion",
      "name": "Body lotion",
      "category": "body",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "patch_test_budget-test-patch",
      "name": "Test patch",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
