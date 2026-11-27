import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dashboard-spec-checklist-mcp",
  "title": "dashboard spec checklist Checklist",
  "description": "Real local JSON analysis of dashboard spec checklist in the Data & AI Ops lane. 25 MCP tools, no paywall.",
  "prefix": "data_dashboard_spec_checklist",
  "entity": "dashboard spec checklist item",
  "categories": [
    {
      "id": "data",
      "label": "data",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
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
      "id": "data_dashboard_spec_checklist-data-1",
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
      "id": "data_dashboard_spec_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
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
      "id": "data_dashboard_spec_checklist-dashboard-spec-3",
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
      "id": "data_dashboard_spec_checklist-mcp-4",
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
      "id": "data_dashboard_spec_checklist-data-5",
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
      "id": "data_dashboard_spec_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
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
      "id": "data_dashboard_spec_checklist-dashboard-spec-7",
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
      "id": "data_dashboard_spec_checklist-mcp-8",
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
