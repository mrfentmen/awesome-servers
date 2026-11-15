import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-dependency-tree-cost-mcp",
  "title": "Dependency Tree Budget Audit",
  "description": "Audit dependency tree budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dependency_tree_budget",
  "entity": "dependency budget line",
  "categories": [
    {
      "id": "runtime",
      "label": "Runtime",
      "baseline": 4
    },
    {
      "id": "development",
      "label": "Development",
      "baseline": 3
    },
    {
      "id": "peer",
      "label": "Peer",
      "baseline": 2
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "runtime",
      "label": "Runtime",
      "categories": [
        "runtime"
      ]
    },
    {
      "id": "development",
      "label": "Development",
      "categories": [
        "development"
      ]
    },
    {
      "id": "peer",
      "label": "Peer",
      "categories": [
        "peer"
      ]
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "categories": [
        "transitive"
      ]
    }
  ],
  "sample": [
    {
      "id": "dependency_tree_budget-runtime-upgrades",
      "name": "Runtime upgrades",
      "category": "runtime",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "dependency_tree_budget-build-tooling",
      "name": "Build tooling",
      "category": "development",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "dependency_tree_budget-peer-alignment",
      "name": "Peer alignment",
      "category": "peer",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "dependency_tree_budget-licence-review",
      "name": "Licence review",
      "category": "transitive",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
