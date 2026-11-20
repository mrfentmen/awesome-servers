import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-repair-request-check-mcp",
  "title": "Repair Request Audit",
  "description": "Audit repair request by issue, notice, access, follow-up coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_repair_request",
  "entity": "repair request item",
  "categories": [
    {
      "id": "issue",
      "label": "Issue",
      "baseline": 2
    },
    {
      "id": "notice",
      "label": "Notice",
      "baseline": 2
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 2
    },
    {
      "id": "follow-up",
      "label": "Follow-up",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "issue"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "follow-up"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_repair_request-issue-1",
      "name": "Issue primary",
      "category": "issue",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-notice-2",
      "name": "Notice primary",
      "category": "notice",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-access-3",
      "name": "Access primary",
      "category": "access",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-follow-up-4",
      "name": "Follow-up primary",
      "category": "follow-up",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-issue-5",
      "name": "Issue backup",
      "category": "issue",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-notice-6",
      "name": "Notice backup",
      "category": "notice",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-access-7",
      "name": "Access backup",
      "category": "access",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_repair_request-follow-up-8",
      "name": "Follow-up backup",
      "category": "follow-up",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
