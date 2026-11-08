import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "webassembly",
  "displayName": "WebAssembly",
  "version": "1.0.0",
  "extensions": [
    ".wat",
    ".wast"
  ],
  "markers": [],
  "comment": ";;",
  "blockComment": {
    "start": "(;",
    "end": ";)"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(func\\s+\\$([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "memory",
      "pattern": "^\\s*\\(memory\\s+\\$([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "global",
      "pattern": "^\\s*\\(global\\s+\\$([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*\\(import\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.wat",
      "content": "(module\n  (func $add (param i32 i32) (result i32)\n    local.get 0\n    local.get 1\n    i32.add)\n)\n"
    },
    {
      "path": "tests/run.wat",
      "content": "(module\n  (func $value (result i32)\n    i32.const 4)\n)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(func $name (param i32) (result i32)\n  local.get 0)"
    },
    "memory": {
      "description": "memory",
      "body": "(memory $memory 1)"
    },
    "module": {
      "description": "module",
      "body": "(module\n  (func $name)\n)"
    }
  },
  "reference": "WebAssembly syntax reference\n- Module: (module ...)\n- Function: (func $name (param i32) (result i32) ...)\n- Local: local.get 0\n- Constant: i32.const 1\n- Add: i32.add\n- Memory: (memory $memory 1)\n- Import: (import \"env\" \"name\" (func $name))\n- Export: (export \"name\" (func $name))\n- Comment: ;; line; (; block ;)\n- Build: wat2wasm file.wat"
}
