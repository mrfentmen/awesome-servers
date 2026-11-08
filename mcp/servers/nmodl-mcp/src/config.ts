import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nmodl",
  "displayName": "NMODL",
  "version": "1.0.0",
  "extensions": [
    ".mod"
  ],
  "markers": [],
  "comment": "//",
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
      "path": "src/demo.mod",
      "content": "NEURON { SUFFIX demo }\n"
    },
    {
      "path": "tests/run.mod",
      "content": "NEURON { SUFFIX demo }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "NEURON { SUFFIX demo }\n"
    }
  },
  "reference": "NMODL syntax reference\n- Example: NEURON { SUFFIX demo }\n- Comment: //\n- No CLI runner configured"
}
