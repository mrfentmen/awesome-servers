import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "latency-bench-checklist-mcp",
  "title": "latency bench checklist Checklist",
  "description": "Real local JSON analysis of latency bench checklist in the AI Test Tools lane. 25 MCP tools, no paywall.",
  "prefix": "aitest_latency_bench_checklist",
  "entity": "latency bench checklist item",
  "categories": [
    {
      "id": "aitest",
      "label": "aitest",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "latency-bench",
      "label": "latency-bench",
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
      "id": "aitest_latency_bench_checklist-aitest-1",
      "name": "aitest primary",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-latency-bench-3",
      "name": "latency-bench primary",
      "category": "latency-bench",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-aitest-5",
      "name": "aitest backup",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-latency-bench-7",
      "name": "latency-bench backup",
      "category": "latency-bench",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
      "id": "aitest_latency_bench_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "ai-test-tools",
        "latency",
        "bench"
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
