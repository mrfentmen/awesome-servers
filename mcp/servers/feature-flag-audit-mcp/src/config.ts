import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "feature-flag-audit-mcp",
  "title": "feature flag audit Audit",
  "description": "Real local JSON analysis of feature flag audit in the Software & DevOps lane. 25 MCP tools, no paywall.",
  "prefix": "dev_feature_flag_audit",
  "entity": "feature flag audit item",
  "categories": [
    {
      "id": "dev",
      "label": "dev",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "feature-flag",
      "label": "feature-flag",
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
        "dev"
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
      "id": "dev_feature_flag_audit-dev-1",
      "name": "dev primary",
      "category": "dev",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-feature-flag-3",
      "name": "feature-flag primary",
      "category": "feature-flag",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-dev-5",
      "name": "dev backup",
      "category": "dev",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-feature-flag-7",
      "name": "feature-flag backup",
      "category": "feature-flag",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
      "id": "dev_feature_flag_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "software-devops",
        "feature",
        "flag"
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
