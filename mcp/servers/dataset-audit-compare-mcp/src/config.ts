import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dataset-audit-compare-mcp",
  "title": "dataset audit compare Compare",
  "description": "Real local JSON analysis of dataset audit compare in the AI Test Tools lane. 25 MCP tools, no paywall.",
  "prefix": "aitest_dataset_audit_compare",
  "entity": "dataset audit compare item",
  "categories": [
    {
      "id": "aitest",
      "label": "aitest",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "dataset-audit",
      "label": "dataset-audit",
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
    "target": 14,
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
      "id": "aitest_dataset_audit_compare-aitest-1",
      "name": "aitest primary",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-dataset-audit-3",
      "name": "dataset-audit primary",
      "category": "dataset-audit",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-aitest-5",
      "name": "aitest backup",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-dataset-audit-7",
      "name": "dataset-audit backup",
      "category": "dataset-audit",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
      "id": "aitest_dataset_audit_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "dataset",
        "audit"
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
