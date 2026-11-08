import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vala",
  "displayName": "Vala",
  "version": "1.0.0",
  "extensions": [
    ".vala",
    ".vapi"
  ],
  "markers": [
    "meson.build"
  ],
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
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|bool|string|double)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.vala",
      "content": "void greet() {\n    stdout.printf(\"Hello from Vala\\n\");\n}\n\nint main(string[] args) {\n    greet();\n    return 0;\n}\n"
    },
    {
      "path": "tests/run.vala",
      "content": "int main(string[] args) {\n    assert(2 + 2 == 4);\n    return 0;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int name(int value) {\n    return value + 1;\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n    public int value { get; set; }\n}"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace App {\n}"
    }
  },
  "reference": "Vala syntax reference\n- Function: int name(int value) { return value + 1; }\n- Class: class Name { public int value { get; set; } }\n- Interface: interface Name { void run(); }\n- Struct: struct Name { int value; }\n- Namespace: namespace App { ... }\n- Using: using GLib;\n- Property: public string name { get; set; }\n- Comment: // line; /* block */\n- Build: valac file.vala"
}
