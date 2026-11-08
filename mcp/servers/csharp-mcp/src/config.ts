import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "csharp",
  "displayName": "C#",
  "version": "1.0.0",
  "extensions": [
    ".cs",
    ".csx"
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
      "path": "src/demo.cs",
      "content": "class Program { static void Main() {} }\n"
    },
    {
      "path": "tests/run.cs",
      "content": "class Program { static void Main() {} }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Program { static void Main() {} }\n"
    }
  },
  "reference": "C# syntax reference\n- Example: class Program { static void Main() {} }\n- Comment: //\n- No CLI runner configured"
}
