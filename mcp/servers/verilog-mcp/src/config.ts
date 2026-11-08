import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "verilog",
  "displayName": "Verilog",
  "version": "1.0.0",
  "extensions": [
    ".v",
    ".veo"
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
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "task",
      "pattern": "^\\s*task\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*`include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "rtl/demo.v",
      "content": "module demo;\n  initial begin\n    $display(\"Hello from Verilog\");\n  end\nendmodule\n"
    },
    {
      "path": "tests/run.v",
      "content": "module test;\n  initial begin\n    if (2 + 2 != 4) $fatal;\n  end\nendmodule\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module name;\n  initial begin\n  end\nendmodule"
    },
    "function": {
      "description": "function",
      "body": "function integer name;\n  input integer value;\n  begin\n    name = value + 1;\n  end\nendfunction"
    },
    "task": {
      "description": "task",
      "body": "task name;\n  begin\n  end\nendtask"
    }
  },
  "reference": "Verilog syntax reference\n- Module: module name; ... endmodule\n- Ports: module name(input wire a, output wire b);\n- Always: always @(posedge clk) begin ... end\n- Initial: initial begin ... end\n- Function: function integer name; ... endfunction\n- Task: task name; ... endtask\n- Include: `include \"file.v\"\n- Comment: // line; /* block */\n- Simulate: iverilog -o out file.v"
}
