export class TelegramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TelegramError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const k = process.env.TELEGRAM_BOT_TOKEN;
  if (!k) throw new TelegramError("Set TELEGRAM_BOT_TOKEN (free @BotFather bot).");
  return `https://api.telegram.org/bot${k}`;
}

async function call(method: string, params: Record<string, string> = {}, httpMethod = "GET"): Promise<string> {
  const url = `${base()}/${method}`;
  let res: Response;
  try {
    if (httpMethod === "GET") {
      const q = new URLSearchParams(params);
      res = await fetch(`${url}?${q.toString()}`, { headers: { ...UA }, signal: AbortSignal.timeout(25000) });
    } else {
      res = await fetch(url, {
        method: "POST",
        headers: { ...UA, "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(25000),
      });
    }
  } catch (e) {
    throw new TelegramError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new TelegramError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function getMe(): Promise<string> {
  return call("getMe");
}

export function sendMessage(chatId: string, text: string): Promise<string> {
  return call("sendMessage", { chat_id: chatId, text }, "POST");
}

export function getUpdates(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return call("getUpdates", { limit: String(n) });
}



export function chatInfo(chatId: string): Promise<string> {
  return call("getChat", { chat_id: chatId });
}

export function memberCount(chatId: string): Promise<string> {
  return call("getChatMemberCount", { chat_id: chatId });
}

export function fileInfo(fileId: string): Promise<string> {
  return call("getFile", { file_id: fileId });
}

export function sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<string> {
  const p: Record<string, string> = { chat_id: chatId, photo: photoUrl };
  if (caption) p.caption = caption;
  return call("sendPhoto", p, "POST");
}

export function myCommands(): Promise<string> {
  return call("getMyCommands");
}

export function deleteMessage(chatId: string, messageId: string): Promise<string> {
  return call("deleteMessage", { chat_id: chatId, message_id: messageId }, "POST");
}

export function editMessage(chatId: string, messageId: string, message: string): Promise<string> {
  return call("editMessageText", { chat_id: chatId, message_id: messageId, text: message }, "POST");
}

// ---- muxG tools:
const TG_TEXT_LIMIT = 4096
const TG_CAPTION_LIMIT = 1024
const TG_CALLBACK_LIMIT = 64
const TG_LIST_CAP = 12

function tgBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function tgBytes(s: string): number {
  return Buffer.byteLength(s, "utf8")
}

/** Check a message against the hard limits the Bot API enforces at send time. */
export async function messageLimitAudit(args: { text?: string; parse_mode?: string; caption?: string }): Promise<string> {
  const text = String(args?.text ?? "")
  const caption = String(args?.caption ?? "")
  const mode = String(args?.parse_mode ?? "").trim()
  if (!text.trim() && !caption.trim()) throw new TelegramError("Pass text, or caption for a media message.")

  const findings: string[] = []
  const lines: string[] = ["Message limit audit, computed locally against the Bot API's documented limits"]

  if (text) {
    const units = [...text].length
    const bytes = tgBytes(text)
    const chunks = Math.max(1, Math.ceil(units / TG_TEXT_LIMIT))
    lines.push(
      `Text: ${units} character(s) (${units} code point(s)), ${bytes} UTF-8 byte(s)`,
      `  documented sendMessage text limit: ${TG_TEXT_LIMIT} characters — ${units > TG_TEXT_LIMIT ? `OVER by ${units - TG_TEXT_LIMIT}, so sendMessage will reject it outright` : `${TG_TEXT_LIMIT - units} left`}`,
      `  would need ${chunks} sendMessage call(s) to deliver, splitting at paragraph boundaries`,
    )
    if (bytes > units) {
      lines.push(`  ${bytes - units} byte(s) more than characters, so the text contains non-ASCII; UTF-16 length is what JavaScript's .length reports, and Telegram counts characters, so emoji outside the BMP still count as one`)
    }
    if (/\r\n/.test(text)) findings.push("text contains Windows line endings, which show up as stray carriage returns in the delivered message")
    if (/\n{3,}/.test(text)) findings.push("text has three or more consecutive newlines, which Telegram renders as a single blank line, so the spacing you see in your editor is not what the user sees")
  }

  if (caption) {
    const units = [...caption].length
    lines.push(
      `Caption: ${units} character(s)`,
      `  documented media caption limit: ${TG_CAPTION_LIMIT} characters — ${units > TG_CAPTION_LIMIT ? `OVER by ${units - TG_CAPTION_LIMIT}, so sendPhoto and friends will reject it` : `${TG_CAPTION_LIMIT - units} left`}`,
    )
    if (caption.length > text.length && text) findings.push("the caption is longer than the text body, which usually means they have been swapped")
  }

  if (mode) {
    const m = mode.toLowerCase()
    if (m === "markdown" || m === "markdownv2") {
      const unescaped = [
        { ch: "_", re: /(?<!\\)_/g, name: "underscore" },
        { ch: "*", re: /(?<!\\)\*/g, name: "asterisk" },
        { ch: "`", re: /(?<!\\)`/g, name: "backtick" },
        { ch: "[", re: /(?<!\\)\[/g, name: "opening bracket" },
      ]
      for (const e of unescaped) {
        const n = (text.match(e.re) ?? []).length
        if (n % 2 !== 0) findings.push(`parse_mode ${mode} is set and the text has an odd number of ${e.name} characters (${n}), which Telegram treats as a formatting error and rejects the whole message`)
      }
      if (m === "markdownv2") {
        const specials = (text.match(/(?<!\\)[_*[\]()~`>#+\-=|{}.!\\]/g) ?? []).length
        if (specials) findings.push(`parse_mode MarkdownV2 requires every one of its ${specials} special character(s) in this text to be escaped with a backslash; an unescaped one makes Telegram reject the message`)
      }
      lines.push(`  parse_mode ${mode} is set, so formatting is interpreted, not shown`)
    } else if (m === "html") {
      const opens = (text.match(/<(b|strong|i|em|u|ins|s|strike|del|code|pre|a|span|blockquote)>/gi) ?? []).length
      const closes = (text.match(/<\/(b|strong|i|em|u|ins|s|strike|del|code|pre|a|span|blockquote)>/gi) ?? []).length
      if (opens !== closes) findings.push(`parse_mode HTML is set with ${opens} opening and ${closes} closing tags, so the message will be rejected as unsupported HTML`)
      if (/[<>]/.test(text.replace(/<\/?[a-z]+>/gi, ""))) findings.push("parse_mode HTML is set and the text contains a bare < or > outside a tag, which Telegram rejects")
      lines.push("  parse_mode HTML is set, so < and & must be escaped as &lt; and &amp; everywhere outside a tag")
    } else {
      lines.push(`  parse_mode "${mode}" is not a documented Bot API value (Markdown, MarkdownV2 or HTML), so Telegram will reject it`)
    }
  } else if (/[*_`<]/.test(text)) {
    lines.push("  no parse_mode set, so any asterisks, underscores, backticks and angle brackets in the text will be shown literally rather than formatted")
  }

  if (/<a href="[^"]*"/.test(text) && !mode) findings.push("the text contains an HTML anchor but no parse_mode is set, so the link markup will appear as literal text to the user")
  if (/\b@[A-Za-z0-9_]{5,}\b/.test(text)) lines.push("  the text mentions something that looks like a @username; it will only linkify if the entity resolves, and only if the surrounding text is plain enough")

  lines.push(
    "",
    findings.length ? "Findings:" : "Nothing flagged against the documented limits.",
    ...findings.map((f) => `  - ${f}`),
    "",
    "These limits are the long-standing documented ones for sendMessage, media captions and callback data. Telegram has changed some of them over the years, so treat the exact numbers as what the documentation said when this was written and the errors above as the failures you are most likely to hit.",
  )
  return lines.join("\n")
}

/** Build a t.me link correctly, which is mostly a matter of encoding it correctly. */
export async function deepLinkBuilder(args: { username?: string; payload?: string; url?: string; text?: string; kind?: string }): Promise<string> {
  const username = String(args?.username ?? "").trim().replace(/^@/, "")
  const kind = String(args?.kind ?? (args?.url || args?.text ? "share" : "start")).trim().toLowerCase()
  if (!username && kind === "start") throw new TelegramError("username is required for a start parameter link, for example mybot.")
  if (username) {
    const valid = /^[A-Za-z0-9_]{5,32}$/.test(username)
    if (!valid) {
      const why = username.length < 5
        ? `it is ${username.length} characters and the documented minimum is 5`
        : username.length > 32
          ? `it is ${username.length} characters and the documented maximum is 32`
          : "it contains a character a username cannot have; only letters, digits and underscore are allowed"
      throw new TelegramError(`"${username}" is not a valid Telegram username: ${why}.`)
    }
  }

  if (kind === "share") {
    const url = String(args?.url ?? "").trim()
    if (!url) throw new TelegramError("url is required for a share link.")
    let check: URL
    try {
      check = new URL(url)
    } catch {
      throw new TelegramError(`"${url}" is not a valid absolute URL.`)
    }
    if (!/^https?:$/.test(check.protocol)) throw new TelegramError(`A share URL must be http or https, and "${check.protocol}" is not.`)
    const text = String(args?.text ?? "")
    const qs = new URLSearchParams({ url: url })
    if (text) qs.set("text", text)
    return [
      `Share link for ${url}${text ? " with prefilled text" : ""}:`,
      `  https://t.me/share/url?${qs.toString()}`,
      "",
      "The url parameter must be fully percent-encoded or Telegram posts the encoded string as the link text; URLSearchParams does that here, which is the whole reason this is worth a tool.",
      "Telegram requires a text parameter alongside a url parameter on a share link, so if you leave text empty the link still works but opens the composer empty.",
    ].join("\n")
  }

  if (kind === "channel") {
    return [
      `Channel link for @${username}:`,
      `  https://t.me/${username}`,
      "",
      "A public channel opens directly. A private channel has no username and uses an invite link instead:",
      "  https://t.me/+<invite-hash>       a join link that can be revoked and reissued",
      "  https://t.me/joinchat/<hash>      the older form, still accepted",
      "",
      "A revoked private invite stops working immediately, so store the hash rather than assuming the link text is stable.",
    ].join("\n")
  }

  const payload = String(args?.payload ?? "")
  const qs = new URLSearchParams()
  if (payload) qs.set("start", payload)
  const link = `https://t.me/${username}${qs.toString() ? `?${qs.toString()}` : ""}`
  return [
    `Deep link for @${username}:`,
    `  ${link}`,
    "",
    payload
      ? "The start payload arrives at your bot as the text of /start, minus the leading slash, and must be 1 to 64 characters of base64url. A payload with a slash in it will not arrive intact, which URLSearchParams prevents."
      : "No payload supplied, so the link just opens the bot chat and the user must press Start themselves.",
    "The payload limit is 64 base64url characters, so it is room for an identifier, not a token blob: keep the state server-side and pass a short key.",
  ].join("\n")
}

/** The limits that bite when you build an inline keyboard. */
export async function inlineKeyboardAudit(args: { keyboard?: string }): Promise<string> {
  const raw = String(args?.keyboard ?? "").trim()
  if (!raw) throw new TelegramError("keyboard is empty. Paste the inline keyboard as JSON, for example [[{\"text\":\"Yes\",\"callback_data\":\"y\"}]].")
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new TelegramError(`The keyboard will not parse as JSON: ${errorMessage(e)}`)
  }
  const rows = Array.isArray(parsed) ? parsed : null
  if (!rows) throw new TelegramError("An inline keyboard must be an array of rows.")
  if (!Array.isArray(rows[0])) {
    throw new TelegramError("Each entry must itself be an array of buttons, so the shape is [[{...}],[{...}]] rather than [{...}].")
  }

  const buttons: { text?: string; callback_data?: string; url?: string; web_app?: { url?: string } }[] = []
  rows.forEach((row) => {
    if (!Array.isArray(row)) throw new TelegramError("A row was not an array of buttons.")
    buttons.push(...(row as typeof buttons))
  })

  const findings: string[] = []
  let cbTotal = 0
  let over = 0
  let missing = 0
  const rowDetail: string[] = []

  rows.forEach((row, ri) => {
    let rowBytes = 0
    for (const b of row as typeof buttons) {
      if (!b.text) findings.push(`row ${ri + 1}: a button has no text, so the user sees an empty box`);
      if (b.callback_data !== undefined) {
        const bytes = tgBytes(b.callback_data)
        rowBytes += bytes
        cbTotal += 1
        if (bytes > TG_CALLBACK_LIMIT) {
          over += 1
          findings.push(`row ${ri + 1}: callback_data "${b.callback_data.slice(0, 40)}" is ${bytes} bytes, over the documented ${TG_CALLBACK_LIMIT}, so Telegram will reject the whole keyboard`)
        }
      } else if (b.url) {
        try {
          const u = new URL(b.url)
          if (!/^(https?|tg):$/.test(u.protocol)) findings.push(`row ${ri + 1}: button url protocol "${u.protocol}" is not supported, Telegram wants https, http or tg`)
        } catch {
          findings.push(`row ${ri + 1}: button url "${String(b.url).slice(0, 40)}" is not a valid URL`)
        }
      } else if (b.web_app?.url) {
        try {
          const u = new URL(b.web_app.url)
          if (u.protocol !== "https:") findings.push(`row ${ri + 1}: a web_app button must use https, and this one uses ${u.protocol}`)
        } catch {
          findings.push(`row ${ri + 1}: web_app url is not a valid URL`)
        }
      } else {
        missing += 1
        findings.push(`row ${ri + 1}: a button has neither callback_data, url nor web_app, so it does nothing when pressed`)
      }
    }
    rowDetail.push(`  row ${ri + 1}: ${(row as unknown[]).length} button(s), ${(row as typeof buttons).length} with callback_data, ${rowBytes} byte(s) of callback data`)
  })

  return [
    "Inline keyboard audit, computed locally against the Bot API's documented limits",
    `${rows.length} row(s), ${buttons.length} button(s) in total`,
    `callback_data strings: ${cbTotal}${over ? `, of which ${over} over the ${TG_CALLBACK_LIMIT}-byte limit` : ""}`,
    "",
    "Rows:",
    ...rowDetail,
    "",
    findings.length ? "Findings:" : "Nothing flagged.",
    ...findings.slice(0, TG_LIST_CAP * 2).map((f) => `  - ${f}`),
    findings.length > TG_LIST_CAP * 2 ? `  ... and ${findings.length - TG_LIST_CAP * 2} more` : "",
    "",
    "callback_data is the hard one: the limit is on bytes, not characters, so a payload of emoji or non-ASCII text can pass a character count and still be rejected.",
    "Telegram rejects the entire keyboard when one button is invalid, so an over-long callback_data takes every other button down with it rather than failing on its own.",
    findings.length ? "" : "A keyboard this size is well inside every documented limit.",
  ]
    .filter(Boolean)
    .join("\n")
}
