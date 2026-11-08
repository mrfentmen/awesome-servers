import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "singularity",
  "displayName": "Singularity",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "# Singularity container\n"
    },
    {
      "path": "tests/run.txt",
      "content": "# Singularity container\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "# Singularity container\n"
    }
  },
  "reference": "Singularity syntax reference\n- Example: # Singularity container\n- Comment: #\n- No CLI runner configured"
}
