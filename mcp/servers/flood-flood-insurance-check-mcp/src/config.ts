import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-insurance-check-mcp",
  "title": "Flood Insurance Audit",
  "description": "Audit flood policy, coverage, contents inventory and proof documents. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_insurance",
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
      "id": "inventory",
      "label": "Inventory",
      "baseline": 1
    },
    {
      "id": "documents",
      "label": "Documents",
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
    "budget": 1000,
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
      "id": "inventory",
      "label": "Inventory",
      "categories": [
        "inventory"
      ]
    },
    {
      "id": "documents",
      "label": "Documents",
      "categories": [
        "documents"
      ]
    }
  ],
  "sample": [
    {
      "id": "flood_insurance-flood-policy",
      "name": "Flood policy",
      "category": "policy",
      "tags": [
        "policy"
      ],
      "cost": 800,
      "quantity": 250000,
      "condition": "good"
    },
    {
      "id": "flood_insurance-coverage-limit",
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
      "id": "flood_insurance-contents-inventory",
      "name": "Contents inventory",
      "category": "inventory",
      "tags": [
        "inventory"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "flood_insurance-proof-of-ownership",
      "name": "Proof of ownership",
      "category": "documents",
      "tags": [
        "documents"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
