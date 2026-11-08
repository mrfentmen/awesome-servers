import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "answer-set-programming",
  "displayName": "Answer Set Programming",
  "version": "1.0.0",
  "extensions": [
    ".lp"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.lp",
      "content": "node(1).\nnode(2).\nedge(1,2).\npath(X,Y) :- edge(X,Y).\n#show path/2.\n"
    },
    {
      "path": "tests/run.lp",
      "content": "node(1).\nnode(2).\nedge(1,2).\npath(X,Y) :- edge(X,Y).\n#show path/2.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "node(1).\nnode(2).\nedge(1,2).\npath(X,Y) :- edge(X,Y).\n#show path/2.\n"
    }
  },
  "reference": "Answer Set Programming syntax reference\n- Example: node(1).\n- Comment: %\n- Run: clingo {file}"
}
