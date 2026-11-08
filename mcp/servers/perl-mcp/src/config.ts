import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "perl",
  "displayName": "Perl",
  "version": "1.0.0",
  "extensions": [
    ".pl",
    ".pm",
    ".t"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    },
    {
      "kind": "subroutine",
      "pattern": "^\\s*sub\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*my\\s+([$@%][A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+([A-Za-z_][A-Za-z0-9_:./]*)"
    }
  ],
  "runner": [
    {
      "command": "perl",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "perl",
      "args": [
        "tests/run.pl"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "lib/Demo.pm",
      "content": "package Demo;\nuse strict;\nuse warnings;\n\nsub greet {\n    print \"Hello from Perl\\n\";\n}\n\n1;\n"
    },
    {
      "path": "tests/run.pl",
      "content": "use strict;\nuse warnings;\nif (2 + 2 != 4) { die \"math failed\"; }\nprint \"ok\\n\";\n"
    }
  ],
  "snippets": {
    "package": {
      "description": "package",
      "body": "package Name;\nuse strict;\nuse warnings;\n\n1;"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "sub name {\n    my ($value) = @_;\n    return $value;\n}"
    },
    "module": {
      "description": "module import",
      "body": "use Name;"
    }
  },
  "reference": "Perl syntax reference\n- Package: package Name;\n- Subroutine: sub name { my ($arg) = @_; return $arg; }\n- Variables: my $scalar; my @array; my %hash;\n- Strict: use strict; use warnings;\n- Module: use Name; require Name;\n- Output: print \"text\\n\";\n- Comment: # line\n- Run: perl file.pl"
}
