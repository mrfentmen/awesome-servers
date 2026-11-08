import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bend",
  "displayName": "Bend",
  "version": "1.0.0",
  "extensions": [
    ".bend"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bend",
      "content": "def add(a, b):\n  return a + b\n"
    },
    {
      "path": "tests/run.bend",
      "content": "def add(a, b):\n  return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b):\n  return a + b\n"
    }
  },
  "reference": "Bend syntax reference\n- Example: def add(a, b):\n- Comment: #\n- Run: bend run {file}"
}
