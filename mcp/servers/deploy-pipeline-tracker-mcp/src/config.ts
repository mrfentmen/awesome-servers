import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "deploy-pipeline-tracker-mcp",
  "title": "deploy pipeline tracker Tracker",
  "description": "Real local JSON analysis of deploy pipeline tracker in the Software & DevOps lane. 25 MCP tools, no paywall.",
  "prefix": "dev_deploy_pipeline_tracker",
  "entity": "deploy pipeline tracker item",
  "categories": [
    {
      "id": "dev",
      "label": "dev",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
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
      "id": "dev_deploy_pipeline_tracker-dev-1",
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
      "id": "dev_deploy_pipeline_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
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
      "id": "dev_deploy_pipeline_tracker-deploy-pipeline-3",
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
      "id": "dev_deploy_pipeline_tracker-mcp-4",
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
      "id": "dev_deploy_pipeline_tracker-dev-5",
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
      "id": "dev_deploy_pipeline_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
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
      "id": "dev_deploy_pipeline_tracker-deploy-pipeline-7",
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
      "id": "dev_deploy_pipeline_tracker-mcp-8",
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
