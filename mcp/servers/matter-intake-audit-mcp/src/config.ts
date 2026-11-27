import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "matter-intake-audit-mcp",
  "title": "matter intake audit Audit",
  "description": "Real local JSON analysis of matter intake audit in the Legal & Compliance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "legalops_matter_intake_audit",
  "entity": "matter intake audit item",
  "categories": [
    {
      "id": "legalops",
      "label": "legalops",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
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
      "id": "legalops_matter_intake_audit-legalops-1",
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
      "id": "legalops_matter_intake_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
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
      "id": "legalops_matter_intake_audit-matter-intake-3",
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
      "id": "legalops_matter_intake_audit-mcp-4",
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
      "id": "legalops_matter_intake_audit-legalops-5",
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
      "id": "legalops_matter_intake_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
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
      "id": "legalops_matter_intake_audit-matter-intake-7",
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
      "id": "legalops_matter_intake_audit-mcp-8",
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
