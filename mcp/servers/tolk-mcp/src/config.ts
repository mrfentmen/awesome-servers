import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tolk",
  "displayName": "Tolk",
  "version": "1.0.0",
  "extensions": [
    ".tolk"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.tolk",
      "content": "fun add(a: int, b: int): int {\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.tolk",
      "content": "fun add(a: int, b: int): int {\n    return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun value(a: int): int {\n    return a + 1;\n}"
    }
  },
  "reference": "Tolk syntax reference\n- Function: fun value(a: int): int { return a + 1; }\n- Struct: struct Name { value: int }\n- Import: import \"file.tolk\"\n- Variable: var value: int = 1;\n- Conditional: if (condition) { ... }\n- Comment: // line; /* block */\n- Compile: tolk file.tolk",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
