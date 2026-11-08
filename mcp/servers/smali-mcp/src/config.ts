import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smali",
  "displayName": "Smali",
  "version": "1.0.0",
  "extensions": [
    ".smali"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.smali",
      "content": ".class public LDemo;\n.method public static add(II)I\n return v0\n.end method\n"
    },
    {
      "path": "tests/run.smali",
      "content": ".class public LDemo;\n.method public static add(II)I\n return v0\n.end method\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".class public LDemo;\n.method public static add(II)I\n return v0\n.end method\n"
    }
  },
  "reference": "Smali syntax reference\n- Example: .class public LDemo;\n- Comment: #\n- No CLI runner configured"
}
