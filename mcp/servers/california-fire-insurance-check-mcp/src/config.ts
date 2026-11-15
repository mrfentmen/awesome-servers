import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-fire-insurance-check-mcp",
  "title": "Wildfire Insurance Audit",
  "description": "Audit wildfire policy, coverage, defensible space and proof documents. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fire_insurance",
  "entity": "insurance item",
  "categories": [
    {
      "id": "policy",
      "label": "Policy",
      "baseline": 2
    },
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 1
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "baseline": 1
    },
    {
      "id": "docs",
      "label": "Docs",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "coverage_usd",
    "label": "Coverage",
    "unit": "USD",
    "target": 250000,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 2800,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "policy",
      "label": "Policy",
      "categories": [
        "policy"
      ]
    },
    {
      "id": "coverage",
      "label": "Coverage",
      "categories": [
        "coverage"
      ]
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "categories": [
        "defensible-space"
      ]
    },
    {
      "id": "docs",
      "label": "Docs",
      "categories": [
        "docs"
      ]
    }
  ],
  "sample": [
    {
      "id": "fire_insurance-wildfire-policy",
      "name": "Wildfire policy",
      "category": "policy",
      "tags": [
        "policy"
      ],
      "cost": 1800,
      "quantity": 250000,
      "condition": "good"
    },
    {
      "id": "fire_insurance-coverage-limit",
      "name": "Coverage limit",
      "category": "coverage",
      "tags": [
        "coverage"
      ],
      "cost": 0,
      "quantity": 250000,
      "condition": "good"
    },
    {
      "id": "fire_insurance-defensible-space",
      "name": "Defensible space",
      "category": "defensible-space",
      "tags": [
        "defensible-space"
      ],
      "cost": 500,
      "quantity": 100,
      "condition": "fair"
    },
    {
      "id": "fire_insurance-proof-documents",
      "name": "Proof documents",
      "category": "docs",
      "tags": [
        "docs"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
