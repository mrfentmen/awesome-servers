import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "resumes-portfolio-link-audit-match-mcp",
  "title": "Portfolio Link Audit Matcher",
  "description": "Real local JSON analysis of portfolio link audit in the Resumes lane. 25 MCP tools, no paywall.",
  "prefix": "resumes_resumes_portfolio_link_audit_match",
  "entity": "portfolio link audit item",
  "categories": [
    {
      "id": "criteria",
      "label": "Criteria",
      "baseline": 2
    },
    {
      "id": "candidates",
      "label": "Candidates",
      "baseline": 2
    },
    {
      "id": "scores",
      "label": "Scores",
      "baseline": 2
    },
    {
      "id": "shortlist",
      "label": "Shortlist",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "clearance_risk",
    "label": "Claim risk",
    "unit": "score",
    "target": 0,
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
        "criteria"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shortlist"
      ]
    }
  ],
  "sample": [
    {
      "id": "resumes_resumes_portfolio_link_audit_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
      "id": "resumes_resumes_portfolio_link_audit_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "resumes",
        "resumes",
        "portfolio"
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
