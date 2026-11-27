import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dashboard-spec-compare-mcp",
  "title": "dashboard spec compare Compare",
  "description": "Real local JSON analysis of dashboard spec compare in the Data & AI Ops lane. 25 MCP tools, no paywall.",
  "prefix": "data_dashboard_spec_compare",
  "entity": "dashboard spec compare item",
  "categories": [
    {
      "id": "data",
      "label": "data",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "dashboard-spec",
      "label": "dashboard-spec",
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
        "data"
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
      "id": "data_dashboard_spec_compare-data-1",
      "name": "data primary",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-dashboard-spec-3",
      "name": "dashboard-spec primary",
      "category": "dashboard-spec",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-data-5",
      "name": "data backup",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-dashboard-spec-7",
      "name": "dashboard-spec backup",
      "category": "dashboard-spec",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
      "id": "data_dashboard_spec_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "dashboard",
        "spec"
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
