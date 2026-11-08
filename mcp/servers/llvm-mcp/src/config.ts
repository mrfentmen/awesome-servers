import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "llvm",
  "displayName": "LLVM",
  "version": "1.0.0",
  "extensions": [
    ".ll"
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
      "path": "src/demo.ll",
      "content": "define i32 @main() { ret i32 0 }\n"
    },
    {
      "path": "tests/run.ll",
      "content": "define i32 @main() { ret i32 0 }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define i32 @main() { ret i32 0 }\n"
    }
  },
  "reference": "LLVM syntax reference\n- Example: define i32 @main() { ret i32 0 }\n- Comment: ;\n- No CLI runner configured"
}
