import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gherkin",
  "displayName": "Gherkin",
  "version": "1.0.0",
  "extensions": [
    ".feature",
    ".story"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.feature",
      "content": "Feature: Demo\n  Scenario: Run\n    Given a step\n"
    },
    {
      "path": "tests/run.feature",
      "content": "Feature: Demo\n  Scenario: Run\n    Given a step\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Feature: Demo\n  Scenario: Run\n    Given a step\n"
    }
  },
  "reference": "Gherkin syntax reference\n- Example: Feature: Demo\n- Comment: #\n- No CLI runner configured"
}
