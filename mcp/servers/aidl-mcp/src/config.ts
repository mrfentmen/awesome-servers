import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "aidl",
  "displayName": "AIDL",
  "version": "1.0.0",
  "extensions": [
    ".aidl"
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
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "parcelable",
      "pattern": "^\\s*parcelable\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "union",
      "pattern": "^\\s*union\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/IDemo.aidl",
      "content": "interface IDemo {\n  int add(int a, int b);\n}\n"
    },
    {
      "path": "src/Demo.aidl",
      "content": "parcelable Demo {\n  String name;\n}\n"
    }
  ],
  "snippets": {
    "interface": {
      "description": "interface",
      "body": "interface IName {\n  int add(int a, int b);\n}"
    },
    "parcelable": {
      "description": "parcelable",
      "body": "parcelable Name {\n  String value;\n}"
    },
    "enum": {
      "description": "enum",
      "body": "enum Name {\n  ONE,\n  TWO\n}"
    }
  },
  "reference": "AIDL syntax reference\n- Interface: interface IName { int add(int a, int b); }\n- Parcelable: parcelable Name { String value; }\n- Enum: enum Name { ONE, TWO }\n- Union: union Name { int value; String text; }\n- Oneway: oneway void notify();\n- In/out: void update(in Value value);\n- Import: import com.example.Value;\n- Comment: // line; /* block */"
}
