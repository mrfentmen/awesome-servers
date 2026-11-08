import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "llvm-ir",
  "displayName": "LLVM IR",
  "version": "1.0.0",
  "extensions": [
    ".ll"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*define\\s+.*@([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "global",
      "pattern": "^\\s*@([A-Za-z_][A-Za-z0-9_.]*)\\s*="
    },
    {
      "kind": "type",
      "pattern": "^\\s*%([A-Za-z_][A-Za-z0-9_.]*)\\s*=\\s*type"
    }
  ],
  "imports": [
    {
      "kind": "declare",
      "pattern": "^\\s*declare\\s+.*@([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ll",
      "content": "; ModuleID = \"demo\"\ndefine i32 @add(i32 %a, i32 %b) {\n  %sum = add i32 %a, %b\n  ret i32 %sum\n}\n"
    },
    {
      "path": "tests/run.ll",
      "content": "define i32 @main() {\n  ret i32 0\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define i32 @name(i32 %value) {\n  ret i32 %value\n}"
    },
    "global": {
      "description": "global",
      "body": "@name = global i32 0"
    },
    "type": {
      "description": "type",
      "body": "%Name = type { i32 }"
    }
  },
  "reference": "LLVM IR syntax reference\n- Function: define i32 @name(i32 %value) { ret i32 %value }\n- Local: %value = add i32 %a, %b\n- Global: @name = global i32 0\n- Type: %Name = type { i32 }\n- Call: %result = call i32 @name(i32 1)\n- Branch: br label %block\n- Declare: declare i32 @printf(ptr, ...)\n- Comment: ; line\n- Compile: llc file.ll"
}
