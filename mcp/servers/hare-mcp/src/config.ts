import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hare",
  "displayName": "Hare",
  "version": "1.0.0",
  "extensions": [
    ".ha"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:export\\s+)?fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:export\\s+)?type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*(?:export\\s+)?(?:const|def)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:let|static)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ha",
      "content": "export fn add(a: i32, b: i32) i32 = a + b;\n\nexport fn main() void = {\n  assert(add(2, 2) == 4);\n};\n"
    },
    {
      "path": "tests/run.ha",
      "content": "export fn main() void = {\n  assert(2 + 2 == 4);\n};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "export fn name(value: i32) i32 = value + 1;"
    },
    "type": {
      "description": "type",
      "body": "export type Name = struct { value: i32 };"
    },
    "loop": {
      "description": "for loop",
      "body": "for (let i = 0; i < 10; i += 1) {\n  // body\n};"
    }
  },
  "reference": "Hare syntax reference\n- Function: export fn name(value: i32) i32 = value + 1;\n- Block function: export fn main() void = { ... };\n- Type: export type Name = struct { value: i32 };\n- Constant: export const NAME: i32 = 1;\n- Variable: let name: i32 = 1;\n- Use: use fmt;\n- Conditional: if (condition) { ... } else { ... };\n- Loop: for (let i = 0; i < 10; i += 1) { ... };\n- Comment: // line\n- Build: hare build"
}
