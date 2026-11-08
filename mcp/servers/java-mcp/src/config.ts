import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "java",
  "displayName": "Java",
  "version": "1.0.0",
  "extensions": [
    ".java"
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
      "path": "src/demo.java",
      "content": "class Main { public static void main(String[] args) {} }\n"
    },
    {
      "path": "tests/run.java",
      "content": "class Main { public static void main(String[] args) {} }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Main { public static void main(String[] args) {} }\n"
    }
  },
  "reference": "Java syntax reference\n- Example: class Main { public static void main(String[] args) {} }\n- Comment: //\n- No CLI runner configured"
}
