import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wallet-check-tracker-mcp",
  "title": "wallet check tracker Tracker",
  "description": "Real local JSON analysis of wallet check tracker in the Web3 & Embedded lane. 25 MCP tools, no paywall.",
  "prefix": "web3_wallet_check_tracker",
  "entity": "wallet check tracker item",
  "categories": [
    {
      "id": "web3",
      "label": "web3",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "wallet-check",
      "label": "wallet-check",
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
    "label": "Days since activity",
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
      "id": "web3_wallet_check_tracker-web3-1",
      "name": "web3 primary",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-wallet-check-3",
      "name": "wallet-check primary",
      "category": "wallet-check",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-web3-5",
      "name": "web3 backup",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-wallet-check-7",
      "name": "wallet-check backup",
      "category": "wallet-check",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
      "id": "web3_wallet_check_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "wallet",
        "check"
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
