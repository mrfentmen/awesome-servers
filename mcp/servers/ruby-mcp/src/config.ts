import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ruby",
  "displayName": "Ruby",
  "version": "1.0.0",
  "extensions": [
    ".rb",
    ".rake",
    ".gemspec"
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
      "path": "src/demo.rb",
      "content": "def add(a, b); a + b; end\n"
    },
    {
      "path": "tests/run.rb",
      "content": "def add(a, b); a + b; end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b); a + b; end\n"
    }
  },
  "reference": "Ruby syntax reference\n- Example: def add(a, b); a + b; end\n- Comment: #\n- No CLI runner configured"
}
