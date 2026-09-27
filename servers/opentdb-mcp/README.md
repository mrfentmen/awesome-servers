# opentdb-mcp

Trivia questions, quizzes and categories - no API key.

## Tools

- `list_categories` — Every trivia category with the numeric id used by the other tools.
- `category_counts` — How many questions a category holds, split by difficulty. Useful before requesting a quiz.
- `global_counts` — How many questions the whole trivia database holds, overall and per category name.
- `get_questions` — Fetch trivia questions with their answers as structured data, for your own formatting.
- `quiz` — A ready-to-read quiz: numbered questions with options and an answer key at the end. Filter by category and difficulty.
- `session_token` — Get or reset a session token. Pass it to quiz or get_questions so the same question is never served twice.
- `compare_categories` — Put two categories side by side: total questions, the easy/medium/hard split with shares, and which of the pair is deeper in hard questions.
- `quiz_readiness` — Pre-flight a planned quiz: does this category hold enough questions at that difficulty for the amount asked, and what is the largest amount it can serve if not.
- `category_quality` — Rank categories by their share of human-verified questions and show pending and rejected counts, so a quiz is not built from a poorly reviewed category.

## Setup

No setup. Questions come from the public Open Trivia DB API.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
