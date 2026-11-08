import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "haxe",
  "displayName": "Haxe",
  "version": "1.0.0",
  "extensions": [
    ".hx"
  ],
  "markers": [
    "haxelib.json",
    "build.hxml"
  ],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:abstract\\s+)?class\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "typedef",
      "pattern": "^\\s*typedef\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:public\\s+|private\\s+|static\\s+)*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.hx",
      "content": "class Demo {\n  static function greet() {\n    trace(\"Hello from Haxe\");\n  }\n\n  static function main() {\n    greet();\n  }\n}\n"
    },
    {
      "path": "tests/Run.hx",
      "content": "class Run {\n  static function main() {\n    if (2 + 2 != 4) throw \"math failed\";\n    trace(\"ok\");\n  }\n}\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name {\n  public function new() {}\n}"
    },
    "interface": {
      "description": "interface",
      "body": "interface Name {\n  function run():Void;\n}"
    },
    "function": {
      "description": "function",
      "body": "static function name(value:Int):Int {\n  return value + 1;\n}"
    }
  },
  "reference": "Haxe syntax reference\n- Class: class Name { public function new() {} }\n- Interface: interface Name { function run():Void; }\n- Enum: enum Name { One; Two; }\n- Typedef: typedef Name = { value:Int };\n- Function: static function name(value:Int):Int { return value + 1; }\n- Import: import haxe.ds.StringMap;\n- Using: using StringTools;\n- Comment: // line; /* block */\n- Build: haxe build.hxml"
}
