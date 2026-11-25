import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "deploy-pipeline-checklist-mcp",
  "title": "deploy pipeline checklist Checklist",
  "description": "Real local JSON analysis of deploy pipeline checklist in the Software & DevOps lane. 25 MCP tools, no paywall.",
  "prefix": "dev_deploy_pipeline_checklist",
  "entity": "deploy pipeline checklist item",
  "categories": [
    {
      "id": "dev",
      "label": "dev",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "deploy-pipeline",
      "label": "deploy-pipeline",
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
      "id": "dev_deploy_pipeline_checklist-dev-1",
      "name": "dev primary",
      "category": "dev",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-deploy-pipeline-3",
      "name": "deploy-pipeline primary",
      "category": "deploy-pipeline",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-dev-5",
      "name": "dev backup",
      "category": "dev",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-deploy-pipeline-7",
      "name": "deploy-pipeline backup",
      "category": "deploy-pipeline",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
      "id": "dev_deploy_pipeline_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "software-devops",
        "deploy",
        "pipeline"
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
