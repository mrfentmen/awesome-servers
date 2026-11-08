import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "miniscript",
  "displayName": "MiniScript",
  "version": "1.0.0",
  "extensions": [
    ".ms"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*function"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ms",
      "content": "add = function(a, b)\n  return a + b\nend function\n"
    },
    {
      "path": "tests/run.ms",
      "content": "add = function(a, b)\n  return a + b\nend function\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name = function(value)\n  return value + 1\nend function"
    }
  },
  "reference": "MiniScript syntax reference\n- Function: name = function(value) return value + 1 end function\n- Variable: value = 1\n- Import: import \"file.ms\"\n- Conditional: if value == 1 then ... end if\n- Loop: for i in range(1, 10) ... end for\n- List: [1, 2, 3]\n- Map: {\"value\": 1}\n- Comment: // line\n- Run: miniscript file.ms"
}
