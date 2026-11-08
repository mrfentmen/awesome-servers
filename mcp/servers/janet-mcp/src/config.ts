import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "janet",
  "displayName": "Janet",
  "version": "1.0.0",
  "extensions": [
    ".janet"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(defn\\s+([A-Za-z_][A-Za-z0-9_*-]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(defmacro\\s+([A-Za-z_][A-Za-z0-9_*-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*\\((?:def|var)\\s+([A-Za-z_][A-Za-z0-9_*-]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*\\(import\\s+([A-Za-z_][A-Za-z0-9_./*-]*)"
    },
    {
      "kind": "use",
      "pattern": "^\\s*\\(use\\s+([A-Za-z_][A-Za-z0-9_./*-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.janet",
      "content": "(defn add [a b]\n  (+ a b))\n\n(print (add 2 2))\n"
    },
    {
      "path": "tests/run.janet",
      "content": "(if (not= (+ 2 2) 4) (error \"math failed\"))\n(print \"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defn name [value]\n  (+ value 1))"
    },
    "variable": {
      "description": "variable",
      "body": "(def name 1)"
    },
    "loop": {
      "description": "loop",
      "body": "(loop [i :range [0 10]]\n  (print i))"
    }
  },
  "reference": "Janet syntax reference\n- Function: (defn name [value] (+ value 1))\n- Macro: (defmacro name [form] form)\n- Variable: (def name 1)\n- Local: (var name 1)\n- Conditional: (if condition then else)\n- Loop: (loop [i :range [0 10]] (print i))\n- Import: (import module)\n- Use: (use module)\n- Comment: # line\n- Run: janet file.janet"
}
