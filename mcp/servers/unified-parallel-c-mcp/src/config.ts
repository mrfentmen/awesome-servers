import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "unified-parallel-c",
  "displayName": "Unified Parallel C",
  "version": "1.0.0",
  "extensions": [
    ".upc"
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
      "path": "src/demo.upc",
      "content": "#include <upc.h>\nint main() { return 0; }\n"
    },
    {
      "path": "tests/run.upc",
      "content": "#include <upc.h>\nint main() { return 0; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "#include <upc.h>\nint main() { return 0; }\n"
    }
  },
  "reference": "Unified Parallel C syntax reference\n- Example: #include <upc.h>\n- Comment: //\n- No CLI runner configured"
}
