const CONFUSABLES: Record<string, string> = {
  "\u0430": "a", "\u0435": "e", "\u043e": "o", "\u0440": "p", "\u0441": "c", "\u0445": "x", "\u0443": "y",
  "\u0456": "i", "\u0458": "j", "\u04bb": "h", "\u03b1": "a", "\u03bf": "o", "\u03c1": "p", "\u03c5": "y",
  "\u0391": "A", "\u039f": "O", "\u2160": "I", "\u2161": "II", "\u2170": "i", "\u2171": "ii",
  "\uff10": "0", "\uff11": "1", "\uff12": "2", "\uff21": "A", "\uff22": "B", "\uff41": "a", "\uff42": "b",
}

const INVISIBLE: Record<number, string> = {
  0x00ad: "soft hyphen", 0x034f: "combining grapheme joiner", 0x061c: "arabic letter mark", 0x115f: "hangul choseong filler",
  0x1160: "hangul jungseong filler", 0x17b4: "khmer vowel inherent aq", 0x17b5: "khmer vowel inherent aa", 0x180e: "mongolian vowel separator",
  0x200b: "zero width space", 0x200c: "zero width non-joiner", 0x200d: "zero width joiner", 0x200e: "left-to-right mark",
  0x200f: "right-to-left mark", 0x202a: "left-to-right embedding", 0x202b: "right-to-left embedding", 0x202c: "pop directional formatting",
  0x202d: "left-to-right override", 0x202e: "right-to-left override", 0x2060: "word joiner", 0x2066: "left-to-right isolate",
  0x2067: "right-to-left isolate", 0x2068: "first strong isolate", 0x2069: "pop directional isolate", 0xfeff: "zero width no-break space",
}

function scriptOf(char: string): string {
  const code = char.codePointAt(0) ?? 0
  if ((code >= 0x30 && code <= 0x39) || (code >= 0x20 && code <= 0x2f) || (code >= 0x3a && code <= 0x40) || (code >= 0x5b && code <= 0x60) || (code >= 0x7b && code <= 0x7e) || code < 0x20) return "Common"
  if (code <= 0x024f || (code >= 0x1e00 && code <= 0x1eff)) return "Latin"
  if (code >= 0x0370 && code <= 0x03ff) return "Greek"
  if (code >= 0x0400 && code <= 0x052f) return "Cyrillic"
  if (code >= 0x0590 && code <= 0x05ff) return "Hebrew"
  if (code >= 0x0600 && code <= 0x06ff) return "Arabic"
  if (code >= 0x0900 && code <= 0x097f) return "Devanagari"
  if (code >= 0x3040 && code <= 0x30ff) return "Japanese"
  if (code >= 0x4e00 && code <= 0x9fff) return "Han"
  if (code >= 0xac00 && code <= 0xd7af) return "Hangul"
  return "Other"
}

function codePoint(char: string): string { return `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}` }

export function analyzeText(input: string) {
  const text = input.normalize("NFC")
  const scripts = new Map<string, number>()
  const confusables: Array<{ char: string; codePoint: string; looksLike: string }> = []
  const invisible: Array<{ char: string; codePoint: string; name: string }> = []
  for (const char of text) {
    const script = scriptOf(char)
    scripts.set(script, (scripts.get(script) ?? 0) + 1)
    const replacement = CONFUSABLES[char]
    if (replacement) confusables.push({ char, codePoint: codePoint(char), looksLike: replacement })
    const invisibleName = INVISIBLE[char.codePointAt(0) ?? 0]
    if (invisibleName) invisible.push({ char, codePoint: codePoint(char), name: invisibleName })
  }
  const meaningfulScripts = [...scripts.keys()].filter((script) => !["Common", "Other"].includes(script))
  const mixedScript = meaningfulScripts.length > 1
  const riskScore = Math.min(100, confusables.length * 18 + invisible.length * 25 + (mixedScript ? 25 : 0))
  return {
    heuristicOnly: true,
    coverage: ["common confusable examples", "selected invisible controls", "coarse script buckets"],
    warning: "A low score is not proof that text is safe. This local heuristic does not implement full Unicode TR39, IDNA, font, or language-specific review.",
    normalized: text,
    length: [...text].length,
    scripts: Object.fromEntries(scripts),
    mixedScript,
    confusables,
    invisible,
    riskScore,
    severity: riskScore >= 60 ? "high" : riskScore >= 25 ? "medium" : "low",
  }
}

export function skeleton(input: string): string {
  return [...input.normalize("NFKC")].filter((char) => !INVISIBLE[char.codePointAt(0) ?? 0]).map((char) => CONFUSABLES[char] ?? char).join("").toLowerCase()
}

export function compareLookalikes(left: string, right: string) {
  const leftSkeleton = skeleton(left)
  const rightSkeleton = skeleton(right)
  const leftInvisible = analyzeText(left).invisible
  const rightInvisible = analyzeText(right).invisible
  return {
    heuristicOnly: true,
    warning: "Same skeleton is a warning aid, not proof of identity. Review the original code points and domain or identifier policy.",
    left: leftSkeleton,
    right: rightSkeleton,
    sameSkeleton: leftSkeleton === rightSkeleton,
    invisibleControls: { left: leftInvisible, right: rightInvisible },
  }
}
