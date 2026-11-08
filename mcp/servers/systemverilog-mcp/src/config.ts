import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "systemverilog",
  "displayName": "SystemVerilog",
  "version": "1.0.0",
  "extensions": [
    ".sv",
    ".svh",
    ".vh"
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
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+(?:automatic\\s+)?[A-Za-z_][A-Za-z0-9_:]*\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*`include\\s+\"([^\"]+)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "rtl/demo.sv",
      "content": "module demo;\n  initial begin\n    $display(\"Hello from SystemVerilog\");\n  end\nendmodule\n"
    },
    {
      "path": "tests/run.sv",
      "content": "module test;\n  initial begin\n    assert (2 + 2 == 4);\n  end\nendmodule\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module name;\n  initial begin\n  end\nendmodule"
    },
    "interface": {
      "description": "interface",
      "body": "interface name;\n  logic value;\nendinterface"
    },
    "class": {
      "description": "class",
      "body": "class Name;\n  int value;\nendclass"
    }
  },
  "reference": "SystemVerilog syntax reference\n- Module: module name; ... endmodule\n- Interface: interface name; ... endinterface\n- Package: package name; ... endpackage\n- Class: class Name; ... endclass\n- Function: function automatic int name(int value); ... endfunction\n- Logic: logic value;\n- Assertion: assert (condition);\n- Include: `include \"file.sv\"\n- Comment: // line; /* block */\n- Build: iverilog -g2012 file.sv"
}
