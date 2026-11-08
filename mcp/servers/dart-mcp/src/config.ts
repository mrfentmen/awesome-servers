import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dart",
  "displayName": "Dart",
  "version": "1.0.0",
  "extensions": [
    ".dart"
  ],
  "markers": [
    "pubspec.yaml"
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
      "kind": "mixin",
      "pattern": "^\\s*mixin\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "extension",
      "pattern": "^\\s*extension\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|double|String|bool|dynamic|Future<[^>]+>)\\s+([a-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+['\"]([^'\"]+)"
    },
    {
      "kind": "export",
      "pattern": "^\\s*export\\s+['\"]([^'\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "bin/demo.dart",
      "content": "void greet() {\n  print(\"Hello from Dart\");\n}\n\nvoid main() {\n  greet();\n}\n"
    },
    {
      "path": "test/run.dart",
      "content": "void main() {\n  if (2 + 2 != 4) throw StateError(\"math failed\");\n  print(\"ok\");\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int name(int value) {\n  return value + 1;\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n  final int value;\n\n  Name(this.value);\n}"
    },
    "mixin": {
      "description": "mixin",
      "body": "mixin Name {\n  void run() {}\n}"
    }
  },
  "reference": "Dart syntax reference\n- Function: int name(int value) { return value + 1; }\n- Variable: final name = value; var name = value;\n- Class: class Name { final int value; Name(this.value); }\n- Mixin: mixin Name { void run() {} }\n- Enum: enum Name { one, two }\n- Extension: extension Name on Type {}\n- Import: import 'package:name/name.dart';\n- Comment: // line; /* block */\n- Run: dart file.dart"
}
