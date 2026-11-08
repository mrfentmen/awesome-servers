import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pddl",
  "displayName": "PDDL",
  "version": "1.0.0",
  "extensions": [
    ".pddl"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.pddl",
      "content": "(define (domain demo) (:predicates (ready)))\n"
    },
    {
      "path": "tests/run.pddl",
      "content": "(define (domain demo) (:predicates (ready)))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(define (domain demo) (:predicates (ready)))\n"
    }
  },
  "reference": "PDDL syntax reference\n- Example: (define (domain demo) (:predicates (ready)))\n- Comment: ;\n- No CLI runner configured"
}
