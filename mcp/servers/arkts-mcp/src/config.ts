import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "arkts",
  "displayName": "ArkTS",
  "version": "1.0.0",
  "extensions": [
    ".ets"
  ],
  "markers": [],
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
      "pattern": "^\\s*(?:export\\s+)?(?:default\\s+)?class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*(?:export\\s+)?interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:export\\s+)?(?:async\\s+)?function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*@Component\\s+struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+.*?from\\s+['\"]([^'\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ets",
      "content": "export class Demo {\n  static add(a: number, b: number): number {\n    return a + b;\n  }\n}\n"
    },
    {
      "path": "tests/run.ets",
      "content": "function check(): boolean {\n  return 2 + 2 === 4;\n}\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "export class Name {\n  value: number = 1;\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(value: number): number {\n  return value + 1;\n}"
    },
    "component": {
      "description": "component",
      "body": "@Component\nstruct Name {\n  build() {\n  }\n}"
    }
  },
  "reference": "ArkTS syntax reference\n- Class: export class Name { value: number = 1; }\n- Interface: export interface Name { value: number; }\n- Function: function name(value: number): number { return value + 1; }\n- Component: @Component struct Name { build() { } }\n- Variable: let value: number = 1;\n- Conditional: if (condition) { ... }\n- Import: import { Name } from './module';\n- Comment: // line; /* block */\n- Build: hvigorw assembleHap"
}
