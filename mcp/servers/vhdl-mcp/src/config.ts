import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vhdl",
  "displayName": "VHDL",
  "version": "1.0.0",
  "extensions": [
    ".vhdl",
    ".vhd",
    ".vhf",
    ".vhi",
    ".vho",
    ".vhs",
    ".vht",
    ".vhw"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "entity",
      "pattern": "^\\s*entity\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "architecture",
      "pattern": "^\\s*architecture\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "component",
      "pattern": "^\\s*component\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "process",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*process"
    }
  ],
  "imports": [
    {
      "kind": "library",
      "pattern": "^\\s*library\\s+([A-Za-z_][A-Za-z0-9_., ]*)"
    },
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_., ]*)"
    }
  ],
  "scaffold": [
    {
      "path": "rtl/demo.vhd",
      "content": "entity demo is\nend entity demo;\n\narchitecture rtl of demo is\nbegin\nend architecture rtl;\n"
    },
    {
      "path": "tests/run.vhd",
      "content": "entity run is\nend entity run;\n\narchitecture rtl of run is\nbegin\n  assert 2 + 2 = 4;\nend architecture rtl;\n"
    }
  ],
  "snippets": {
    "entity": {
      "description": "entity",
      "body": "entity name is\nend entity name;"
    },
    "architecture": {
      "description": "architecture",
      "body": "architecture rtl of name is\nbegin\nend architecture rtl;"
    },
    "process": {
      "description": "process",
      "body": "name : process\nbegin\nend process;"
    }
  },
  "reference": "VHDL syntax reference\n- Entity: entity name is ... end entity name;\n- Architecture: architecture rtl of name is ... end architecture rtl;\n- Package: package name is ... end package;\n- Component: component name ... end component;\n- Signal: signal name : std_logic;\n- Process: name : process begin ... end process;\n- Library: library ieee;\n- Use: use ieee.std_logic_1164.all;\n- Comment: -- line\n- Simulate: ghdl -a file.vhd"
}
