import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mlir",
  "displayName": "MLIR",
  "version": "1.0.0",
  "extensions": [
    ".mlir"
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
      "path": "src/demo.mlir",
      "content": "module { func.func @main() { return } }\n"
    },
    {
      "path": "tests/run.mlir",
      "content": "module { func.func @main() { return } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module { func.func @main() { return } }\n"
    }
  },
  "reference": "MLIR syntax reference\n- Example: module { func.func @main() { return } }\n- Comment: //\n- No CLI runner configured"
}
