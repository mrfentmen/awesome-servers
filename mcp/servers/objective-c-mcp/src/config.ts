import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "objective-c",
  "displayName": "Objective-C",
  "version": "1.0.0",
  "extensions": [
    ".m",
    ".h"
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
      "kind": "interface",
      "pattern": "^\\s*@interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "implementation",
      "pattern": "^\\s*@implementation\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "protocol",
      "pattern": "^\\s*@protocol\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*[-+]\\s*\\([^)]*\\)\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*[A-Za-z_][A-Za-z0-9_ *]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*#import\\s+[<\"]([^>\"]+)[>\"]"
    },
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+[<\"]([^>\"]+)[>\"]"
    }
  ],
  "runner": [
    {
      "command": "clang",
      "args": [
        "-x",
        "objective-c",
        "-fobjc-arc",
        "-framework",
        "Foundation",
        "{file}",
        "-o",
        "{build}/{stem}"
      ]
    },
    {
      "command": "{build}/{stem}",
      "args": []
    }
  ],
  "syntax": {
    "command": "clang",
    "args": [
      "-x",
      "objective-c",
      "-fsyntax-only",
      "{file}"
    ]
  },
  "build": [
    {
      "command": "clang",
      "args": [
        "-x",
        "objective-c",
        "-fobjc-arc",
        "-framework",
        "Foundation",
        "{file}",
        "-o",
        "{build}/{stem}"
      ]
    }
  ],
  "test": [
    {
      "command": "clang",
      "args": [
        "-x",
        "objective-c",
        "-fobjc-arc",
        "-framework",
        "Foundation",
        "tests/run.m",
        "-o",
        "{build}/tests"
      ]
    },
    {
      "command": "{build}/tests",
      "args": []
    }
  ],
  "scaffold": [
    {
      "path": "main.m",
      "content": "#import <Foundation/Foundation.h>\n\n@interface Greeter : NSObject\n- (void)greet;\n@end\n\n@implementation Greeter\n- (void)greet {\n  printf(\"Hello from Objective-C\\n\");\n}\n@end\n\nint main(void) {\n  @autoreleasepool {\n    Greeter *greeter = [Greeter new];\n    [greeter greet];\n  }\n  return 0;\n}\n"
    },
    {
      "path": "tests/run.m",
      "content": "#import <Foundation/Foundation.h>\n\nint main(void) {\n  @autoreleasepool {\n    if (2 + 2 != 4) return 1;\n    printf(\"ok\\n\");\n  }\n  return 0;\n}\n"
    }
  ],
  "snippets": {
    "interface": {
      "description": "class interface",
      "body": "@interface Name : NSObject\n- (void)run;\n@end"
    },
    "implementation": {
      "description": "class implementation",
      "body": "@implementation Name\n- (void)run {\n  NSLog(@\"Hello\");\n}\n@end"
    },
    "method": {
      "description": "instance method",
      "body": "- (void)name {\n  // body\n}"
    }
  },
  "reference": "Objective-C syntax reference\n- Import: #import <Foundation/Foundation.h>\n- Interface: @interface Name : NSObject ... @end\n- Implementation: @implementation Name ... @end\n- Method: - (returnType)name:(Type)arg;\n- Call: [object name:value]\n- Property: @property (nonatomic, copy) NSString *name;\n- Protocol: @protocol Name ... @end\n- Memory: ARC handles retain/release\n- Autorelease pool: @autoreleasepool { ... }\n- Compile: clang -x objective-c -fobjc-arc -framework Foundation file.m"
}
