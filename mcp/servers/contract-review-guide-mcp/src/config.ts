import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "contract-review-guide-mcp",
  "title": "contract review guide Guide",
  "description": "Real local JSON analysis of contract review guide in the Law & Paperwork lane. 25 MCP tools, no paywall.",
  "prefix": "law_contract_review_guide",
  "entity": "contract review guide item",
  "categories": [
    {
      "id": "law",
      "label": "law",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "contract-review",
      "label": "contract-review",
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
        "law"
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
      "id": "law_contract_review_guide-law-1",
      "name": "law primary",
      "category": "law",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-contract-review-3",
      "name": "contract-review primary",
      "category": "contract-review",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-law-5",
      "name": "law backup",
      "category": "law",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-contract-review-7",
      "name": "contract-review backup",
      "category": "contract-review",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
      "id": "law_contract_review_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "contract",
        "review"
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
