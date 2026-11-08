import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "robotframework",
  "displayName": "Robot Framework",
  "version": "1.0.0",
  "extensions": [
    ".robot",
    ".resource"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "test",
      "pattern": "^\\s*([A-Z][A-Za-z0-9_ ]*)\\s*$"
    },
    {
      "kind": "section",
      "pattern": "^\\*\\*\\*\\s*([A-Za-z ]+)\\s*\\*\\*\\*"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*\\$\\{([A-Za-z_][A-Za-z0-9_]*)\\}\\s*="
    }
  ],
  "imports": [
    {
      "kind": "library",
      "pattern": "^\\s*Library\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "resource",
      "pattern": "^\\s*Resource\\s+([A-Za-z_][A-Za-z0-9_./-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "tests/demo.robot",
      "content": "*** Settings ***\nLibrary    Collections\n\n*** Test Cases ***\nDemo\n    Log    2 + 2\n"
    },
    {
      "path": "resources/demo.resource",
      "content": "*** Keywords ***\nDemo Keyword\n    Log    ok\n"
    }
  ],
  "snippets": {
    "test": {
      "description": "test case",
      "body": "Demo\n    Log    2 + 2"
    },
    "keyword": {
      "description": "keyword",
      "body": "Demo Keyword\n    [Arguments]    ${value}\n    Log    ${value}"
    },
    "library": {
      "description": "library",
      "body": "Library    Collections"
    }
  },
  "reference": "Robot Framework syntax reference\n- Settings: *** Settings ***\n- Test cases: *** Test Cases ***\n- Keywords: *** Keywords ***\n- Test: Demo\n- Step: Log    2 + 2\n- Variable: ${NAME}    value\n- Library: Library    Collections\n- Resource: Resource    file.resource\n- Comment: # line\n- Run: robot tests/"
}
