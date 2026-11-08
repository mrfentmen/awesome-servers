import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cmake",
  "displayName": "CMake",
  "version": "1.0.0",
  "extensions": [
    ".cmake"
  ],
  "markers": [
    "CMakeLists.txt"
  ],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s*\\(\\s*([A-Za-z0-9_]+)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*macro\\s*\\(\\s*([A-Za-z0-9_]+)"
    },
    {
      "kind": "project",
      "pattern": "^\\s*project\\s*\\(\\s*([A-Za-z0-9_]+)"
    },
    {
      "kind": "executable",
      "pattern": "^\\s*add_executable\\s*\\(\\s*([A-Za-z0-9_]+)"
    },
    {
      "kind": "library",
      "pattern": "^\\s*add_library\\s*\\(\\s*([A-Za-z0-9_]+)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s*\\(\\s*([^\\s)]+)"
    },
    {
      "kind": "find_package",
      "pattern": "^\\s*find_package\\s*\\(\\s*([^\\s)]+)"
    },
    {
      "kind": "subdirectory",
      "pattern": "^\\s*add_subdirectory\\s*\\(\\s*([^\\s)]+)"
    }
  ],
  "runner": [
    {
      "command": "cmake",
      "args": [
        "-P",
        "{file}"
      ]
    }
  ],
  "build": [
    {
      "command": "cmake",
      "args": [
        "-S",
        "{dir}",
        "-B",
        "{build}"
      ]
    },
    {
      "command": "cmake",
      "args": [
        "--build",
        "{build}"
      ]
    }
  ],
  "test": [
    {
      "command": "cmake",
      "args": [
        "-P",
        "tests/run.cmake"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "CMakeLists.txt",
      "content": "cmake_minimum_required(VERSION 3.16)\nproject({{name}} LANGUAGES NONE)\ninclude(cmake/hello.cmake)\n"
    },
    {
      "path": "cmake/hello.cmake",
      "content": "message(STATUS \"Hello from CMake\")\n"
    },
    {
      "path": "tests/run.cmake",
      "content": "if(NOT 2 EQUAL 2)\n  message(FATAL_ERROR \"math failed\")\nendif()\nmessage(STATUS \"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function(name arg)\n  # body\nendfunction()"
    },
    "target": {
      "description": "executable target",
      "body": "add_executable(name main.cpp)\ntarget_link_libraries(name PRIVATE library)"
    },
    "package": {
      "description": "find package",
      "body": "find_package(Package REQUIRED)\ntarget_link_libraries(name PRIVATE Package::Package)"
    }
  },
  "reference": "CMake syntax reference\n- Minimum version: cmake_minimum_required(VERSION 3.16)\n- Project: project(Name LANGUAGES CXX)\n- Executable: add_executable(name main.cpp)\n- Library: add_library(name STATIC source.cpp)\n- Link: target_link_libraries(name PRIVATE library)\n- Variables: set(NAME value); message(STATUS \"${NAME}\")\n- Conditions: if(CONDITION) ... elseif(...) ... endif()\n- Loops: foreach(item IN LISTS list) ... endforeach()\n- Functions: function(name arg) ... endfunction()\n- Include: include(path.cmake); add_subdirectory(dir)\n- Run a script: cmake -P file.cmake"
}
