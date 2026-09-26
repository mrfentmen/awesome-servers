# Trivia MCP

## Tagline
Trivia questions, quizzes and categories - no API key.

## Description
Build trivia from your AI assistant: browse every category with question counts, fetch raw questions filtered by category, difficulty or type, get a ready-to-read quiz with an answer key, use session tokens so questions never repeat, and check database totals. No account or key. An independent MCP server. Not affiliated with or endorsed by Open Trivia DB.

## Setup Requirements
No setup. Questions come from the public Open Trivia DB API.

## Category
Education

## Features

- List categories: Every trivia category with the numeric id used by the other tools.
- Category question counts: How many questions a category holds, split by difficulty. Useful before requesting a quiz.
- Database totals: How many questions the whole trivia database holds, overall and per category name.
- Get raw questions: Fetch trivia questions with their answers as structured data, for your own formatting.
- Build a quiz: A ready-to-read quiz: numbered questions with options and an answer key at the end. Filter by category and difficulty.
- Session token: Get or reset a session token. Pass it to quiz or get_questions so the same question is never served twice.

## Getting Started

- Ask your assistant about opentdb using this server once installed
- Tool: list_categories — Every trivia category with the numeric id used by the other tools.
- Tool: category_counts — How many questions a category holds, split by difficulty. Useful before requesting a quiz.
- Tool: global_counts — How many questions the whole trivia database holds, overall and per category name.
- Tool: get_questions — Fetch trivia questions with their answers as structured data, for your own formatting.
- Tool: quiz — A ready-to-read quiz: numbered questions with options and an answer key at the end. Filter by category and difficulty.
- Tool: session_token — Get or reset a session token. Pass it to quiz or get_questions so the same question is never served twice.

## Tags
trivia, quiz, questions, education, games, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/opentdb-mcp
