import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bluespec",
  "displayName": "Bluespec",
  "version": "1.0.0",
  "extensions": [
    ".bsv"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "rule",
      "pattern": "^\\s*rule\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.bsv",
      "content": "package Demo;\n\nmodule mkDemo();\nendmodule\n\nendpackage\n"
    },
    {
      "path": "tests/Run.bsv",
      "content": "package Run;\n\nmodule mkRun();\nendmodule\n\nendpackage\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module mkName();\nendmodule"
    },
    "interface": {
      "description": "interface",
      "body": "interface Name;\n  method Action run();\nendinterface"
    },
    "rule": {
      "description": "rule",
      "body": "rule name;\nendrule"
    }
  },
  "reference": "Bluespec syntax reference\n- Package: package Name; ... endpackage\n- Module: module mkName(); ... endmodule\n- Interface: interface Name; method Action run(); endinterface\n- Function: function int name(int value);\n- Rule: rule name; ... endrule\n- Method: method Action run(); ... endmethod\n- Import: import Name;\n- Comment: // line; /* block */\n- Build: bsc -u -verilog file.bsv"
}
