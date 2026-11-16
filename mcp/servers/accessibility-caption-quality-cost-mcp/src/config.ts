import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-caption-quality-cost-mcp",
  "title": "Caption Quality Budget Audit",
  "description": "Audit caption quality budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caption_quality_budget",
  "entity": "caption track budget line",
  "categories": [
    {
      "id": "accuracy",
      "label": "Accuracy",
      "baseline": 3
    },
    {
      "id": "timing",
      "label": "Timing",
      "baseline": 2
    },
    {
      "id": "speaker",
      "label": "Speaker labels",
      "baseline": 1
    },
    {
      "id": "sound",
      "label": "Sound effects",
      "baseline": 1
    },
    {
      "id": "readability",
      "label": "Readability",
      "baseline": 1
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
    "budget": 50,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "accuracy",
      "label": "Accurate words",
      "categories": [
        "accuracy"
      ]
    },
    {
      "id": "timing",
      "label": "Synced timing",
      "categories": [
        "timing"
      ]
    },
    {
      "id": "speakers",
      "label": "Speaker labels",
      "categories": [
        "speaker"
      ]
    },
    {
      "id": "sounds",
      "label": "Sound description",
      "categories": [
        "sound"
      ]
    },
    {
      "id": "readability",
      "label": "Readable lines",
      "categories": [
        "readability"
      ]
    }
  ],
  "sample": [
    {
      "id": "caption_quality_budget-lecture-captions",
      "name": "Lecture captions",
      "category": "accuracy",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "caption_quality_budget-interview-captions",
      "name": "Interview captions",
      "category": "accuracy",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "caption_quality_budget-panel-captions",
      "name": "Panel captions",
      "category": "accuracy",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "caption_quality_budget-live-captions",
      "name": "Live captions",
      "category": "timing",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "fair"
    },
    {
      "id": "caption_quality_budget-tutorial-captions",
      "name": "Tutorial captions",
      "category": "timing",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "caption_quality_budget-webinar-captions",
      "name": "Webinar captions",
      "category": "speaker",
      "tags": [
        "budget"
      ],
      "cost": 7,
      "quantity": 7,
      "condition": "worn"
    },
    {
      "id": "caption_quality_budget-short-film-captions",
      "name": "Short film captions",
      "category": "sound",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "caption_quality_budget-course-captions",
      "name": "Course captions",
      "category": "readability",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
