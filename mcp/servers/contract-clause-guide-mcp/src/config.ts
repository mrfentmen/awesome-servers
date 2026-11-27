import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "contract-clause-guide-mcp",
  "title": "contract clause guide Guide",
  "description": "Real local JSON analysis of contract clause guide in the Legal & Compliance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "legalops_contract_clause_guide",
  "entity": "contract clause guide item",
  "categories": [
    {
      "id": "legalops",
      "label": "legalops",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "contract-clause",
      "label": "contract-clause",
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
        "legalops"
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
      "id": "legalops_contract_clause_guide-legalops-1",
      "name": "legalops primary",
      "category": "legalops",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-contract-clause-3",
      "name": "contract-clause primary",
      "category": "contract-clause",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-legalops-5",
      "name": "legalops backup",
      "category": "legalops",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-contract-clause-7",
      "name": "contract-clause backup",
      "category": "contract-clause",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
      "id": "legalops_contract_clause_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "legal-compliance-ops",
        "contract",
        "clause"
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
