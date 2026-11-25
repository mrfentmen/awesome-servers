import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "model-compare-audit-mcp",
  "title": "model compare audit Audit",
  "description": "Real local JSON analysis of model compare audit in the AI Test Tools lane. 25 MCP tools, no paywall.",
  "prefix": "aitest_model_compare_audit",
  "entity": "model compare audit item",
  "categories": [
    {
      "id": "aitest",
      "label": "aitest",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "model-compare",
      "label": "model-compare",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 7,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "aitest"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "aitest_model_compare_audit-aitest-1",
      "name": "aitest primary",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-model-compare-3",
      "name": "model-compare primary",
      "category": "model-compare",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-aitest-5",
      "name": "aitest backup",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-model-compare-7",
      "name": "model-compare backup",
      "category": "model-compare",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "aitest_model_compare_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
