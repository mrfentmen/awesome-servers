import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "python",
  "displayName": "Python",
  "version": "1.0.0",
  "extensions": [
    ".py",
    ".pyi",
    ".pyw"
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
      "path": "src/demo.py",
      "content": "def add(a, b):\n    return a + b\n"
    },
    {
      "path": "tests/run.py",
      "content": "def add(a, b):\n    return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b):\n    return a + b\n"
    }
  },
  "reference": "Python syntax reference\n- Example: def add(a, b):\n- Comment: #\n- No CLI runner configured"
}
