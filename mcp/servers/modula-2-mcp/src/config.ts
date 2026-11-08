import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "modula-2",
  "displayName": "Modula-2",
  "version": "1.0.0",
  "extensions": [
    ".mod"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*MODULE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*PROCEDURE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*(?:FROM\\s+([A-Za-z_][A-Za-z0-9_]*)\\s+)?IMPORT"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.mod",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    },
    {
      "path": "tests/run.mod",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE Name;\nPROCEDURE Value(a: INTEGER): INTEGER;\nBEGIN\n  RETURN a + 1\nEND Value;\nEND Name.\n"
    }
  },
  "reference": "Modula-2 syntax reference\n- Module: MODULE Name; ... END Name.\n- Procedure: PROCEDURE Value(a: INTEGER): INTEGER; ... END Value;\n- Import: IMPORT InOut;\n- Variable: VAR value: INTEGER;\n- Conditional: IF condition THEN ... END\n- Loop: WHILE condition DO ... END\n- Comment: (* block *)\n- Compile: gm2 file.mod",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
