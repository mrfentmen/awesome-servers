import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gas-plan-checklist-mcp",
  "title": "gas plan checklist Checklist",
  "description": "Real local JSON analysis of gas plan checklist in the Web3 & Embedded lane. 25 MCP tools, no paywall.",
  "prefix": "web3_gas_plan_checklist",
  "entity": "gas plan checklist item",
  "categories": [
    {
      "id": "web3",
      "label": "web3",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "gas-plan",
      "label": "gas-plan",
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
        "web3"
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
      "id": "web3_gas_plan_checklist-web3-1",
      "name": "web3 primary",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-gas-plan-3",
      "name": "gas-plan primary",
      "category": "gas-plan",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-web3-5",
      "name": "web3 backup",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-gas-plan-7",
      "name": "gas-plan backup",
      "category": "gas-plan",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
      "id": "web3_gas_plan_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "gas",
        "plan"
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
