import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "renderscript",
  "displayName": "RenderScript",
  "version": "1.0.0",
  "extensions": [
    ".rs",
    ".rsh"
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
      "path": "src/demo.rs",
      "content": "#pragma version(1)\nint root() { return 0; }\n"
    },
    {
      "path": "tests/run.rs",
      "content": "#pragma version(1)\nint root() { return 0; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "#pragma version(1)\nint root() { return 0; }\n"
    }
  },
  "reference": "RenderScript syntax reference\n- Example: #pragma version(1)\n- Comment: //\n- No CLI runner configured"
}
