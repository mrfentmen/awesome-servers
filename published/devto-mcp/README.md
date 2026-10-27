# dev.to MCP

Read articles and posts from the public dev.to API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `latest_articles`  The latest articles.
* `search_articles`  Search articles.

* `article_details`
* `user_articles`
* `tag_list`
* `videos`
* `podcasts`
* `top_articles`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public dev.to API.
