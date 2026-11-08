import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "slice",
  "displayName": "Slice",
  "version": "1.0.0",
  "extensions": [
    ".ice"
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
      "path": "src/demo.ice",
      "content": "module Demo { interface Add { int add(int a, int b); }; };\n"
    },
    {
      "path": "tests/run.ice",
      "content": "module Demo { interface Add { int add(int a, int b); }; };\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo { interface Add { int add(int a, int b); }; };\n"
    }
  },
  "reference": "Slice syntax reference\n- Example: module Demo { interface Add { int add(int a, int b); }; };\n- Comment: //\n- No CLI runner configured"
}
