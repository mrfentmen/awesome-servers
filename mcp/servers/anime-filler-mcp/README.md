# anime filler mcp

The question every weeb asks: **is this episode filler?**

Powered by [animefillerlist.com](https://www.animefillerlist.com) (scraped
politely, no official API exists).

## Tools

- `search_anime`, find an anime, get its slug
- `get_episode_lists`, full canon/filler breakdown with episode ranges
- `is_episode_filler`, verdict for one episode, with title + air date

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Is Naruto Shippuden episode 57 filler?"
>
> `is_episode_filler("naruto-shippuden", 57)` →
> "Episode 57 of Naruto Shippuden is FILLER, skippable, safe to skip.
> Title: 'Robbed of Sleep' (aired 2008-05-08)"

> "Which One Piece episodes can I skip?"
> `get_episode_lists("one-piece")` → 1010 canon, 94 filler, with ranges.
