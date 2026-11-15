import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-api-spec-cost-mcp",
  "title": "API Spec Budget Audit",
  "description": "Audit api spec budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "api_spec_budget",
  "entity": "API contract element budget line",
  "categories": [
    {
      "id": "endpoints",
      "label": "Endpoints",
      "baseline": 3
    },
    {
      "id": "schemas",
      "label": "Schemas",
      "baseline": 2
    },
    {
      "id": "authentication",
      "label": "Authentication",
      "baseline": 2
    },
    {
      "id": "errors",
      "label": "Errors",
      "baseline": 2
    },
    {
      "id": "examples",
      "label": "Examples",
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
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "endpoints",
      "label": "Endpoints",
      "categories": [
        "endpoints"
      ]
    },
    {
      "id": "schemas",
      "label": "Schemas",
      "categories": [
        "schemas"
      ]
    },
    {
      "id": "authentication",
      "label": "Authentication",
      "categories": [
        "authentication"
      ]
    },
    {
      "id": "errors",
      "label": "Errors",
      "categories": [
        "errors"
      ]
    },
    {
      "id": "examples",
      "label": "Examples",
      "categories": [
        "examples"
      ]
    }
  ],
  "sample": [
    {
      "id": "api_spec_budget-spec-linting",
      "name": "Spec linting",
      "category": "endpoints",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "api_spec_budget-schema-review",
      "name": "Schema review",
      "category": "schemas",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "api_spec_budget-auth-review",
      "name": "Auth review",
      "category": "authentication",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "api_spec_budget-error-examples",
      "name": "Error examples",
      "category": "errors",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "api_spec_budget-example-tests",
      "name": "Example tests",
      "category": "examples",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
