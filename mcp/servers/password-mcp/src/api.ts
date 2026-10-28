/**
 * Password Tools — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

import { randomInt } from "node:crypto"

const LOWER = "abcdefghijklmnopqrstuvwxyz"
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~"
const AMBIGUOUS = "Il1O0o"

const COMMON = ["password", "passw0rd", "letmein", "welcome", "admin", "qwerty", "iloveyou", "monkey", "dragon", "football", "baseball", "shadow", "master", "sunshine", "princess", "abc123"]

const WORDS = ("apple anchor amber arrow atlas award bacon badge baker bamboo banana banjo barber basket beacon beetle begin bell berry bicycle biscuit bitter blanket blossom bottle boulder branch brave bread breeze bridge bright broom brother bubble bucket buffalo button cabin cactus candle canoe canvas canyon captain carpet carrot castle cattle cellar cereal chalk cherry chess chicken chimney chorus cider cinema circle circus clay clever cliff climate cloak clock cloud clover cluster coffee comet compass concert copper coral corner cotton council country cousin cowboy crane crayon cream cricket crimson crystal curtain cyclone dagger daisy dancer dawn delta desert diamond dinner dolphin donut dragon dream drummer eagle earth echo elbow elder ember engine enjoy envelope equal escape essay evening fabric falcon family fancy farmer feather festival fiddle figure filter finger firefly fisher flannel flute forest fortune fountain fox freedom friend frontier frost galaxy garden garlic gentle ginger glacier glance glove golden goose granite grape gravel green guitar hammer hamlet harbor harvest hazel helmet hermit hero hickory hill hobby honey horizon horse hostel humble hunter iceberg igloo indigo insect island ivory jacket jaguar jasmine jelly jewel jockey journey judge jungle juniper kettle keyboard kingdom kitten knight ladder lagoon lantern laughter lavender leader lemon leopard letter liberty library lilac lily linen lion lizard lobster locket lumber lunar magnet mango maple marble marine market meadow medal melon mentor mercury meteor midnight milk mineral mirror mitten monarch monkey monster morning mosaic mountain muffin mulberry museum mustard needle neighbor nickel noodle north notebook nutmeg oasis ocean olive onion orange orbit orchard orchid ostrich otter owl oyster paddle palace panda pantry papaya parcel parsley passport pasture peach peacock peanut pearl pebble pelican pencil penguin pepper petal phantom phoenix piano picnic pigeon pilot pineapple pillow pioneer pirate pistol planet plasma plateau plum pocket polar pond poodle popcorn poppy potato prairie pretzel printer prism pumpkin puppet purple puzzle pyramid quail quarry quartz quill quilt rabbit raccoon radar rainbow raven ribbon river robin rocket rodeo rose riddle saddle saffron salmon salute sandal sapphire scarlet scholar scissors sculptor seagull seed shadow shark sheep shelf shell ship shore shrimp shovel silver sketch skipper sled slipper smile smoke snail snow soccer socket soldier sonnet sparrow spice spider spiral spirit sponge spring sprout squirrel star statue steam steel stellar stencil stone storm story straw stream street string student sugar summer summit sunset surf swallow sweater swift sword syrup table tailor talent teapot temple tennis text thimble thunder tiger timber tissue toast tomato torch tornado tortoise towel tower traffic train treasure tree tricky tricycle trophy trumpet tulip tundra tunnel turtle umbrella unicorn valley vanilla velvet vendor verse vessel village violet violin volcano voyage waffle wagon walnut walrus wander wave weaver welcome wheat whistle willow window winter wisdom wolf wonder yacht yarn yellow yogurt zebra zephyr zigzag zipper").split(" ")

function pick(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)]
}

function entropyBits(pool: number, length: number): number {
  return Math.round(length * Math.log2(pool) * 10) / 10
}

export async function generatePassword(a: {
  length?: number
  upper?: boolean
  digits?: boolean
  symbols?: boolean
  excludeAmbiguous?: boolean
}): Promise<string> {
  const length = Math.floor(a.length ?? 20)
  if (!Number.isInteger(length) || length < 8 || length > 128) throw new SourceError("length must be between 8 and 128")
  const useUpper = a.upper !== false
  const useDigits = a.digits !== false
  const useSymbols = a.symbols === true
  const excludeAmbiguous = a.excludeAmbiguous !== false
  let alphabet = LOWER
  if (useUpper) alphabet += UPPER
  if (useDigits) alphabet += DIGITS
  if (useSymbols) alphabet += SYMBOLS
  if (excludeAmbiguous) alphabet = alphabet.split("").filter((c) => !AMBIGUOUS.includes(c)).join("")
  const required: string[] = [LOWER, useUpper ? UPPER : "", useDigits ? DIGITS : "", useSymbols ? SYMBOLS : ""]
    .filter(Boolean)
    .map((set) => (excludeAmbiguous ? set.split("").filter((c) => !AMBIGUOUS.includes(c)).join("") : set))
    .filter((set) => set.length > 0)
  if (required.length > length) throw new SourceError("length is too small for the selected character classes")
  const chars: string[] = required.map(pick)
  while (chars.length < length) chars.push(pick(alphabet))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = chars[i]
    chars[i] = chars[j]
    chars[j] = tmp
  }
  const password = chars.join("")
  return [
    password,
    "",
    bullet("length", length),
    bullet("pool", `${alphabet.length} characters (${[useUpper ? "upper" : "", "lower", useDigits ? "digits" : "", useSymbols ? "symbols" : ""].filter(Boolean).join(", ")})`),
    bullet("estimated entropy", `~${entropyBits(alphabet.length, length)} bits`),
    excludeAmbiguous ? bullet("excluded", `look-alike characters (${AMBIGUOUS})`) : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function generatePassphrase(a: { words?: number; separator?: string; capitalise?: boolean }): Promise<string> {
  const count = Math.floor(a.words ?? 5)
  if (!Number.isInteger(count) || count < 3 || count > 10) throw new SourceError("words must be between 3 and 10")
  const separator = a.separator === undefined ? "-" : String(a.separator)
  if (separator.length > 3) throw new SourceError("separator can be at most 3 characters")
  const chosen: string[] = []
  for (let i = 0; i < count; i++) {
    let word = WORDS[randomInt(WORDS.length)]
    if (a.capitalise) word = word[0].toUpperCase() + word.slice(1)
    chosen.push(word)
  }
  return [
    chosen.join(separator),
    "",
    bullet("words", count),
    bullet("word list", `${WORDS.length} words`),
    bullet("estimated entropy", `~${entropyBits(WORDS.length + 1, count)} bits (word list plus separator depth is not counted)`),
    "Words come from a small built-in list, so treat the entropy figure as a lower bound.",
  ].join("\n")
}

export async function checkPasswordStrength(a: { password: string }): Promise<string> {
  const password = String(a.password ?? "")
  if (!password) throw new SourceError("password is required")
  if (password.length > 512) throw new SourceError("password must be at most 512 characters")
  let pool = 0
  if (/[a-z]/.test(password)) pool += 26
  if (/[A-Z]/.test(password)) pool += 26
  if (/[0-9]/.test(password)) pool += 10
  if (/[^A-Za-z0-9]/.test(password)) pool += 33
  let bits = password.length * Math.log2(pool || 1)
  const notes: string[] = []
  if (/^(.)\1+$/.test(password)) {
    bits = Math.min(bits, 10)
    notes.push("the whole password is one repeated character")
  }
  const lower = password.toLowerCase()
  const dictHits = [...COMMON, ...WORDS].filter((w) => w.length >= 4 && lower.includes(w))
  if (dictHits.length) {
    bits -= dictHits.length * Math.log2(WORDS.length)
    notes.push(`contains dictionary word(s): ${dictHits.slice(0, 4).join(", ")}`)
  }
  if (/(.)\1{2,}/.test(password)) {
    bits -= 6
    notes.push("has a run of three or more identical characters")
  }
  if (/abcdefghijklmnopqrstuvwxyz|0123456789|qwerty/i.test(password)) {
    bits -= 8
    notes.push("contains a long sequence or keyboard run")
  }
  const rounded = Math.max(0, Math.round(bits * 10) / 10)
  const verdict =
    rounded < 28 ? "very weak" : rounded < 36 ? "weak" : rounded < 60 ? "reasonable" : rounded < 80 ? "strong" : "very strong"
  const suggestions: string[] = []
  if (password.length < 16) suggestions.push(`adding ${16 - password.length} more character(s) would help most`)
  if (!/[A-Z]/.test(password)) suggestions.push("mix in upper-case letters")
  if (!/[0-9]/.test(password)) suggestions.push("mix in digits")
  if (!/[^A-Za-z0-9]/.test(password)) suggestions.push("mix in symbols")
  return [
    `Verdict: ${verdict} (~${rounded} bits of entropy).`,
    "",
    bullet("length", password.length),
    bullet("pool", `${pool} possible characters`),
    ...notes.map((n) => `- ${n}`),
    ...(suggestions.length ? ["", "Suggestions:", ...suggestions.map((s) => `- ${s}`)] : []),
    "",
    "This is a length-and-variety estimate, not a check against breach databases.",
  ].join("\n")
}

export async function listPasswordWords(a: { search?: string }): Promise<string> {
  const search = clean(a.search).toLowerCase()
  const hits = WORDS.filter((w) => !search || w.includes(search))
  if (!hits.length) throw new SourceError(`no built-in word contains "${clean(a.search)}"`)
  const shown = hits.slice(0, 80)
  return [
    `${hits.length} word(s) in the passphrase list${search ? ` matching "${clean(a.search)}"` : ""}${hits.length > shown.length ? `, showing ${shown.length}` : ""}:`,
    "",
    shown.join(", "),
  ].join("\n")
}
