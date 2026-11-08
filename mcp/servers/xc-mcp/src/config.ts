import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xc",
  "displayName": "XC",
  "version": "1.0.0",
  "extensions": [
    ".xc"
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
      "path": "src/demo.xc",
      "content": "int main() { return 0; }\n"
    },
    {
      "path": "tests/run.xc",
      "content": "int main() { return 0; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int main() { return 0; }\n"
    }
  },
  "reference": "XC syntax reference\n- Example: int main() { return 0; }\n- Comment: //\n- No CLI runner configured"
}
