import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "matter-intake-guide-mcp",
  "title": "matter intake guide Guide",
  "description": "Real local JSON analysis of matter intake guide in the Legal & Compliance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "legalops_matter_intake_guide",
  "entity": "matter intake guide item",
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
      "id": "matter-intake",
      "label": "matter-intake",
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
      "id": "legalops_matter_intake_guide-legalops-1",
      "name": "legalops primary",
      "category": "legalops",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-matter-intake-3",
      "name": "matter-intake primary",
      "category": "matter-intake",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-legalops-5",
      "name": "legalops backup",
      "category": "legalops",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-matter-intake-7",
      "name": "matter-intake backup",
      "category": "matter-intake",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
      "id": "legalops_matter_intake_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "legal-compliance-ops",
        "matter",
        "intake"
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
