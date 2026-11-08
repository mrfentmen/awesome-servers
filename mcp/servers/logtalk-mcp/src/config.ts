import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "logtalk",
  "displayName": "Logtalk",
  "version": "1.0.0",
  "extensions": [
    ".lgt",
    ".logtalk"
  ],
  "markers": [],
  "comment": "%",
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
      "kind": "object",
      "pattern": "^\\s*:- object\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "protocol",
      "pattern": "^\\s*:- protocol\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "category",
      "pattern": "^\\s*:- category\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "predicate",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*:-"
    }
  ],
  "imports": [
    {
      "kind": "use_module",
      "pattern": "^\\s*:- use_module\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "extends",
      "pattern": "^\\s*:- extends\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.lgt",
      "content": ":- object(demo).\n\n:- public(add/3).\nadd(A, B, C) :- C is A + B.\n\n:- end_object.\n"
    },
    {
      "path": "tests/run.lgt",
      "content": ":- object(run).\n\n:- public(main/0).\nmain :- write(ok), nl.\n\n:- end_object.\n"
    }
  ],
  "snippets": {
    "object": {
      "description": "object",
      "body": ":- object(name).\n\n:- public(value/1).\nvalue(1).\n\n:- end_object."
    },
    "protocol": {
      "description": "protocol",
      "body": ":- protocol(name).\n:- public(value/1).\n:- end_protocol."
    },
    "predicate": {
      "description": "predicate",
      "body": "name(A, B) :- B is A + 1."
    }
  },
  "reference": "Logtalk syntax reference\n- Object: :- object(name). ... :- end_object.\n- Protocol: :- protocol(name). ... :- end_protocol.\n- Category: :- category(name). ... :- end_category.\n- Public: :- public(name/1).\n- Predicate: name(A, B) :- B is A + 1.\n- Extends: :- extends(other).\n- Import: :- use_module(library).\n- Comment: % line; /* block */\n- Run: swilgt file.lgt"
}
