import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "literate-agda",
  "displayName": "Literate Agda",
  "version": "1.0.0",
  "extensions": [
    ".lagda"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.lagda",
      "content": "\\begin{code}\nmodule Demo where\n\\end{code}\n"
    },
    {
      "path": "tests/run.lagda",
      "content": "\\begin{code}\nmodule Demo where\n\\end{code}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "\\begin{code}\nmodule Demo where\n\\end{code}\n"
    }
  },
  "reference": "Literate Agda syntax reference\n- Example: \\begin{code}\n- Comment: --\n- No CLI runner configured"
}
