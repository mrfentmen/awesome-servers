import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bluespec-bh",
  "displayName": "Bluespec BH",
  "version": "1.0.0",
  "extensions": [
    ".bs"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bs",
      "content": "module mkDemo(Empty);\n  rule run;\n    $display(\"hello\");\n  endrule\nendmodule\n"
    },
    {
      "path": "tests/run.bs",
      "content": "module mkDemo(Empty);\n  rule run;\n    $display(\"hello\");\n  endrule\nendmodule\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module mkDemo(Empty);\n  rule run;\n    $display(\"hello\");\n  endrule\nendmodule\n"
    }
  },
  "reference": "Bluespec BH syntax reference\n- Example: module mkDemo(Empty);\n- Comment: //\n- Run: bsc -sim {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
