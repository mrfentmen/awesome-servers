import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "data-contract-checklist-mcp",
  "title": "data contract checklist Checklist",
  "description": "Real local JSON analysis of data contract checklist in the Data & AI Ops lane. 25 MCP tools, no paywall.",
  "prefix": "data_data_contract_checklist",
  "entity": "data contract checklist item",
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
      "id": "data-contract",
      "label": "data-contract",
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
      "id": "data_data_contract_checklist-data-1",
      "name": "data primary",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-data-contract-3",
      "name": "data-contract primary",
      "category": "data-contract",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-data-5",
      "name": "data backup",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-data-contract-7",
      "name": "data-contract backup",
      "category": "data-contract",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
      "id": "data_data_contract_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "data",
        "contract"
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
