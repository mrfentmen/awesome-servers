import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ada",
  "displayName": "Ada",
  "version": "1.0.0",
  "extensions": [
    ".adb",
    ".ads",
    ".ada"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+(?:body\\s+)?([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "task",
      "pattern": "^\\s*task\\s+(?:type\\s+|body\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "with",
      "pattern": "^\\s*with\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.adb",
      "content": "procedure Demo is\nbegin\n   null;\nend Demo;\n"
    },
    {
      "path": "tests/run.adb",
      "content": "with Ada.Text_IO;\nprocedure Run is\nbegin\n   Ada.Text_IO.Put_Line(\"ok\");\nend Run;\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "procedure Name is\nbegin\n   null;\nend Name;"
    },
    "package": {
      "description": "package",
      "body": "package Name is\nend Name;"
    },
    "task": {
      "description": "task",
      "body": "task Name is\nend Name;"
    }
  },
  "reference": "Ada syntax reference\n- Procedure: procedure Name is begin null; end Name;\n- Function: function Name return Integer is begin return 1; end Name;\n- Package: package Name is ... end Name;\n- Task: task Name is ... end Name;\n- Type: type Name is record Value : Integer; end record;\n- With: with Ada.Text_IO;\n- Use: use Ada.Text_IO;\n- Comment: -- line\n- Build: gnatmake file.adb"
}
