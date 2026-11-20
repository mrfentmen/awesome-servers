import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-deposit-recovery-check-mcp",
  "title": "Deposit Recovery Audit",
  "description": "Audit deposit recovery by amount, photos, notice, deductions coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_deposit_recovery",
  "entity": "deposit recovery item",
  "categories": [
    {
      "id": "amount",
      "label": "Amount",
      "baseline": 2
    },
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "notice",
      "label": "Notice",
      "baseline": 2
    },
    {
      "id": "deductions",
      "label": "Deductions",
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
        "amount"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deductions"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_deposit_recovery-amount-1",
      "name": "Amount primary",
      "category": "amount",
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
      "id": "tenant_deposit_recovery-photos-2",
      "name": "Photos primary",
      "category": "photos",
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
      "id": "tenant_deposit_recovery-notice-3",
      "name": "Notice primary",
      "category": "notice",
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
      "id": "tenant_deposit_recovery-deductions-4",
      "name": "Deductions primary",
      "category": "deductions",
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
      "id": "tenant_deposit_recovery-amount-5",
      "name": "Amount backup",
      "category": "amount",
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
      "id": "tenant_deposit_recovery-photos-6",
      "name": "Photos backup",
      "category": "photos",
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
      "id": "tenant_deposit_recovery-notice-7",
      "name": "Notice backup",
      "category": "notice",
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
      "id": "tenant_deposit_recovery-deductions-8",
      "name": "Deductions backup",
      "category": "deductions",
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
