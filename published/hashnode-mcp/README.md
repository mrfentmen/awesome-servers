# hashnode-mcp

Query Hashnode GraphQL (token; set HASHNODE_TOKEN, raw Authorization; uses gql-beta endpoint): profile, publication posts, user.

## Tools

- `me` — The Hashnode user the token belongs to.
- `publication_posts` — Recent posts in a Hashnode publication.
- `get_user` — One Hashnode profile by username.

- `publication_info` — About a blog.
- `post_details` — Single post.
- `series_list` — Blog series.
- `tag_info` — Tag details.
- `user_stats` — Follower count.
- `user_publications` — Blogs by a user.
- `publication_members` — Members and roles.

## Source

[hashnode-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/hashnode-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `author_engagement`
* `user_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-hashnode-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
