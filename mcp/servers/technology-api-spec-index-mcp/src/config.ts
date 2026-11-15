import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-api-spec-index-mcp",
  "title": "API Spec Archive",
  "description": "Archive api spec by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "api_spec_index",
  "entity": "API contract element archive",
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
    "id": "spec_coverage",
    "label": "Spec coverage",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
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
      "id": "api_spec_index-get-accounts",
      "name": "GET /accounts",
      "category": "endpoints",
      "tags": [
        "read",
        "json"
      ],
      "cost": 4,
      "quantity": 92,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "api_spec_index-post-transfers",
      "name": "POST /transfers",
      "category": "endpoints",
      "tags": [
        "write",
        "json"
      ],
      "cost": 6,
      "quantity": 65,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "api_spec_index-account-schema",
      "name": "Account schema",
      "category": "schemas",
      "tags": [
        "object",
        "money"
      ],
      "cost": 3,
      "quantity": 86,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "api_spec_index-pagination-schema",
      "name": "Pagination schema",
      "category": "schemas",
      "tags": [
        "cursor"
      ],
      "cost": 2,
      "quantity": 58,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "api_spec_index-oauth-scope-matrix",
      "name": "OAuth scope matrix",
      "category": "authentication",
      "tags": [
        "oauth",
        "scope"
      ],
      "cost": 5,
      "quantity": 74,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "api_spec_index-error-envelope",
      "name": "Error envelope",
      "category": "errors",
      "tags": [
        "problem-json"
      ],
      "cost": 3,
      "quantity": 42,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "api_spec_index-rate-limit-example",
      "name": "Rate limit example",
      "category": "errors",
      "tags": [
        "429"
      ],
      "cost": 1,
      "quantity": 50,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "api_spec_index-transfer-request-example",
      "name": "Transfer request example",
      "category": "examples",
      "tags": [
        "curl"
      ],
      "cost": 2,
      "quantity": 95,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
