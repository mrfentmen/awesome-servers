import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-contrast-audit-cost-mcp",
  "title": "Contrast Budget Audit",
  "description": "Audit contrast budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "contrast_audit_budget",
  "entity": "UI element budget line",
  "categories": [
    {
      "id": "text",
      "label": "Text",
      "baseline": 6
    },
    {
      "id": "icon",
      "label": "Icons",
      "baseline": 4
    },
    {
      "id": "button",
      "label": "Buttons",
      "baseline": 4
    },
    {
      "id": "form",
      "label": "Form controls",
      "baseline": 4
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
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "text",
      "label": "Text contrast",
      "categories": [
        "text"
      ]
    },
    {
      "id": "icon",
      "label": "Icon contrast",
      "categories": [
        "icon"
      ]
    },
    {
      "id": "button",
      "label": "Button contrast",
      "categories": [
        "button"
      ]
    },
    {
      "id": "form",
      "label": "Form contrast",
      "categories": [
        "form"
      ]
    }
  ],
  "sample": [
    {
      "id": "contrast_audit_budget-body-text",
      "name": "Body text",
      "category": "text",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "contrast_audit_budget-muted-text",
      "name": "Muted text",
      "category": "text",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "contrast_audit_budget-toolbar-icon",
      "name": "Toolbar icon",
      "category": "icon",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "contrast_audit_budget-primary-button",
      "name": "Primary button",
      "category": "button",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "contrast_audit_budget-input-border",
      "name": "Input border",
      "category": "form",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "worn"
    },
    {
      "id": "contrast_audit_budget-placeholder-text",
      "name": "Placeholder text",
      "category": "form",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    }
  ]
}
