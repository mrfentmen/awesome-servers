import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-patch-test-check-mcp",
  "title": "Patch Test Audit",
  "description": "Audit patch test by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "patch_test",
  "entity": "tested product",
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
    "id": "patch_hours",
    "label": "Patch hours",
    "unit": "hours",
    "target": 24,
    "direction": "higher"
  },
  "target": {
    "maxItems": 10,
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 90
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
      "id": "patch_test-serum",
      "name": "New serum",
      "category": "face",
      "tags": [
        "fragrance-free",
        "night"
      ],
      "cost": 35,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "patch_test-cleanser",
      "name": "New cleanser",
      "category": "face",
      "tags": [
        "gentle",
        "daily"
      ],
      "cost": 22,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "patch_test-eye",
      "name": "Eye cream",
      "category": "eye",
      "tags": [
        "fragrance-free",
        "night"
      ],
      "cost": 28,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "patch_test-lip",
      "name": "Lip balm",
      "category": "lip",
      "tags": [
        "balm",
        "daily"
      ],
      "cost": 10,
      "quantity": 48,
      "condition": "good"
    },
    {
      "id": "patch_test-lotion",
      "name": "Body lotion",
      "category": "body",
      "tags": [
        "lotion",
        "daily"
      ],
      "cost": 18,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "patch_test-patch",
      "name": "Test patch",
      "category": "tool",
      "tags": [
        "adhesive",
        "small"
      ],
      "cost": 5,
      "quantity": 24,
      "condition": "good"
    }
  ]
}
