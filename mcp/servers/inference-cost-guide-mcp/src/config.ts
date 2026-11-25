import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "inference-cost-guide-mcp",
  "title": "inference cost guide Guide",
  "description": "Real local JSON analysis of inference cost guide in the AI Test Tools lane. 25 MCP tools, no paywall.",
  "prefix": "aitest_inference_cost_guide",
  "entity": "inference cost guide item",
  "categories": [
    {
      "id": "aitest",
      "label": "aitest",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "inference-cost",
      "label": "inference-cost",
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
      "id": "aitest_inference_cost_guide-aitest-1",
      "name": "aitest primary",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-inference-cost-3",
      "name": "inference-cost primary",
      "category": "inference-cost",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-aitest-5",
      "name": "aitest backup",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-inference-cost-7",
      "name": "inference-cost backup",
      "category": "inference-cost",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
      "id": "aitest_inference_cost_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "inference",
        "cost"
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
