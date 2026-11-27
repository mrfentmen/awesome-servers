import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "node-validator-audit-mcp",
  "title": "node validator audit Audit",
  "description": "Real local JSON analysis of node validator audit in the Web3 & Embedded lane. 25 MCP tools, no paywall.",
  "prefix": "web3_node_validator_audit",
  "entity": "node validator audit item",
  "categories": [
    {
      "id": "web3",
      "label": "web3",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "node-validator",
      "label": "node-validator",
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
      "id": "web3_node_validator_audit-web3-1",
      "name": "web3 primary",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-node-validator-3",
      "name": "node-validator primary",
      "category": "node-validator",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-web3-5",
      "name": "web3 backup",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-node-validator-7",
      "name": "node-validator backup",
      "category": "node-validator",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
      "id": "web3_node_validator_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "node",
        "validator"
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
