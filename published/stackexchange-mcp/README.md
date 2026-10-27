# Stack Exchange MCP

Search questions and read answers across Stack Exchange sites from the public Stack Exchange API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search questions.
* `answers`  Answers for a question.

* `questions`
* `question_details`
* `tags`
* `top_users`
* `sites`
* `answer_lookup`
* `question_comments`
* `user_answers`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Stack Exchange API. Use site names like stackoverflow or serverfault.
