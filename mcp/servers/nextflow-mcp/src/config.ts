import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nextflow",
  "displayName": "Nextflow",
  "version": "1.0.0",
  "extensions": [
    ".nf"
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
      "path": "src/demo.nf",
      "content": "process demo { script: \"echo hello\" }\n"
    },
    {
      "path": "tests/run.nf",
      "content": "process demo { script: \"echo hello\" }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "process demo { script: \"echo hello\" }\n"
    }
  },
  "reference": "Nextflow syntax reference\n- Example: process demo { script: \"echo hello\" }\n- Comment: //\n- No CLI runner configured"
}
