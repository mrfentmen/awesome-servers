import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "witcher-script",
  "displayName": "Witcher Script",
  "version": "1.0.0",
  "extensions": [
    ".ws"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+(?:\\w+\\s+)?([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:var|const)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ws",
      "content": "function int add(int a, int b)\n{\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.ws",
      "content": "function int add(int a, int b)\n{\n    return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function int name(int value)\n{\n    return value + 1;\n}"
    }
  },
  "reference": "Witcher Script syntax reference\n- Function: function int name(int value) { return value + 1; }\n- Class: class Name extends Base { ... }\n- Variable: var value : int;\n- Constant: const NAME : int = 1;\n- Conditional: if (condition) { ... }\n- Loop: for (i = 0; i < 10; i += 1) { ... }\n- Comment: // line; /* block */\n- Run: witcherscript-compiler file.ws",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
