import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "llvm-tablegen",
  "displayName": "LLVM TableGen",
  "version": "1.0.0",
  "extensions": [
    ".td"
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
      "path": "src/demo.td",
      "content": "def ADD : Instruction { let Namespace = \"DEMO\"; }\n"
    },
    {
      "path": "tests/run.td",
      "content": "def ADD : Instruction { let Namespace = \"DEMO\"; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def ADD : Instruction { let Namespace = \"DEMO\"; }\n"
    }
  },
  "reference": "LLVM TableGen syntax reference\n- Example: def ADD : Instruction { let Namespace = \"DEMO\"; }\n- Comment: //\n- No CLI runner configured"
}
