import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cpp",
  "displayName": "C++",
  "version": "1.0.0",
  "extensions": [
    ".cpp",
    ".cc",
    ".cxx",
    ".hpp"
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
      "path": "src/demo.cpp",
      "content": "int main() { return 0; }\n"
    },
    {
      "path": "tests/run.cpp",
      "content": "int main() { return 0; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int main() { return 0; }\n"
    }
  },
  "reference": "C++ syntax reference\n- Example: int main() { return 0; }\n- Comment: //\n- No CLI runner configured"
}
